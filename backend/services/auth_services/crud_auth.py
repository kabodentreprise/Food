from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import User, PasswordResetToken
from app.schemas import UserCreate
from services.user_services.crud_user import get_user_by_email
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone # <-- Ajout de 'timezone' ici
from typing import Optional
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Vérifie les identifiants de connexion."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_active:
        return None
    if not pwd_context.verify(password, user.hashed_password):
        return None
    return user

def create_user(
    db: Session,
    user: UserCreate,
    is_admin: bool = False,
    is_super_admin: bool = False,
    is_livreur: bool = False,
    is_active: bool = True
) -> Optional[User]:
    """
    Crée un nouvel utilisateur avec un mot de passe haché et les rôles spécifiés.
    """
    hashed_password = pwd_context.hash(user.password)

    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=is_active,
        is_admin=is_admin,
        is_super_admin=is_super_admin,
        is_livreur=is_livreur,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        delivery_address=user.delivery_address
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        return None


# ------------------ RÉINITIALISATION DE MOT DE PASSE ------------------

def create_password_reset_token(db: Session, user_id: int) -> str:
    """
    Crée un code unique de 5 chiffres pour réinitialisation, valable 15 minutes.
    Supprime les anciens codes existants pour l'utilisateur.
    """
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id
    ).delete()
    db.commit()

    code = str(secrets.randbelow(100000)).zfill(5)
    # Correction : Utiliser datetime.now(timezone.utc) pour un datetime "offset-aware"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    db_token = PasswordResetToken(
        token=code,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    return code

def get_valid_password_reset_token(db: Session, email: str, code: str) -> Optional[PasswordResetToken]:
    """
    Vérifie si un code de réinitialisation est valide pour l'utilisateur donné.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None

    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.token == code
    ).first()

    # Comparaison avec un datetime "offset-aware"
    if db_token and db_token.expires_at > datetime.now(timezone.utc):
        return db_token
    return None

def delete_password_reset_token(db: Session, token_id: int) -> bool:
    """
    Supprime un code de réinitialisation (après usage ou expiration).
    """
    db_token = db.query(PasswordResetToken).filter(PasswordResetToken.id == token_id).first()
    if db_token:
        db.delete(db_token)
        db.commit()
        return True
    return False 

def update_user_password(db: Session, user_id: int, new_password: str) -> Optional[User]:
    """Change le mot de passe d’un utilisateur."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None

    db_user.hashed_password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(db_user)
    return db_user