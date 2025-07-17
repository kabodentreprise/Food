# security.py

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.session import SessionLocal
from app.models import User
from app.schemas import UserOut
from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/routers/auth/token")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les informations d'identification",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")

    return UserOut.from_orm(user)

async def get_current_active_user(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    """
    Vérifie que l'utilisateur est authentifié ET actif.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif. Veuillez contacter un administrateur."
        )
    return current_user

async def get_current_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges d'administrateur."
        )
    return current_user


# Dépendance unique pour livreur
async def get_current_livreur(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not current_user.is_livreur:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges de livreur."
        )
    return current_user

async def get_current_active_livreur(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    """
    Vérifie que l'utilisateur est authentifié, actif ET a le rôle livreur.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif. Veuillez contacter un administrateur."
        )
    if not current_user.is_livreur:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges de livreur."
        )
    return current_user

async def get_current_super_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges de super-administrateur."
        )
    return current_user

async def get_current_admin_or_super_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not (current_user.is_admin or current_user.is_super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges d'administrateur ou super-administrateur."
        )
    return current_user

async def get_current_livreur_or_super_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not (current_user.is_livreur or current_user.is_super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Opération non autorisée. Nécessite les privilèges livreur ou super-administrateur."
        )
    return current_user
