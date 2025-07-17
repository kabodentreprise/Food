# D:\FIN\backend\app\routers\auth.py

from fastapi import APIRouter, HTTPException, Depends, status, Body
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.schemas import UserCreate, Token, UserOut
from services.user_services.crud_user import (
    authenticate_user,
    create_user,
    create_password_reset_token,
    get_valid_password_reset_token,
    delete_password_reset_token,
    update_user_password,
    get_user_by_email
)
from app.session import get_db
from app.core.security import create_access_token
from utils.email_utils import send_reset_email
from app.core.config import settings
from app.models import User # Votre modèle utilisateur SQLAlchemy


router = APIRouter(tags=["Authentification"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Enregistre un nouvel utilisateur."""
    db_user = get_user_by_email(db, user_data.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'email est déjà enregistré.")
    created_user = create_user(db, user_data)
    return created_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authentifie l'utilisateur et renvoie un jeton d'accès avec les informations de l'utilisateur.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Email ou mot de passe invalide")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "is_admin": user.is_admin,
            "is_super_admin": user.is_super_admin,
            "is_livreur": user.is_livreur, # <-- AJOUTEZ CETTE LIGNE CLÉ ICI
            "is_active": user.is_active, # <-- BONNE PRATIQUE : Ajoutez également is_active au token
        },
        expires_delta=access_token_expires
    )

    # Construisez l'objet UserOut complet à partir de l'objet utilisateur SQLAlchemy
    # Cette partie est déjà correcte et s'assure que toutes les infos sont dans la réponse
    user_out_data = UserOut(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        delivery_address=user.delivery_address,
        is_active=user.is_active,
        is_admin=user.is_admin,
        is_super_admin=user.is_super_admin,
        is_livreur=user.is_livreur # <-- Assurez-vous que c'est aussi dans le UserOut renvoyé
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_out_data
    )

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Demande un code de réinitialisation de mot de passe, envoie un email si l'utilisateur existe.
    Gère les erreurs d'envoi d'email.
    """
    user = get_user_by_email(db, email)
    if not user:
        # Mesure de sécurité : Ne pas révéler si l'email existe.
        # Le frontend affichera toujours un message de succès apparent pour ne pas donner d'indices.
        return {"message": "Si l'email existe, un code de réinitialisation a été envoyé."}

    reset_code = create_password_reset_token(db, user.id)

    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la génération du code de réinitialisation."
        )

    try:
        email_sent = await send_reset_email(to_email=user.email, reset_code=reset_code)
        if not email_sent:
            print(f"Échec de l'envoi de l'e-mail de réinitialisation pour {user.email}: Le service d'envoi a signalé un problème.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Échec de l'envoi de l'e-mail de réinitialisation. Veuillez réessayer plus tard."
            )
    except Exception as e:
        print(f"Une erreur inattendue est survenue lors de l'envoi de l'e-mail pour {user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur interne est survenue lors de l'envoi de l'e-mail. Veuillez contacter l'administrateur."
        )

    return {"message": "Un code de réinitialisation a été envoyé à votre adresse email."}

@router.post("/verify-reset-code", status_code=status.HTTP_200_OK)
def verify_reset_code(
    email: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Vérifie la validité du code de réinitialisation."""
    db_token = get_valid_password_reset_token(db, email, code)
    if not db_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code invalide ou expiré.")
    return {"message": "Code vérifié avec succès. Vous pouvez maintenant réinitialiser votre mot de passe."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    email: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Réinitialise le mot de passe après vérification du code."""
    db_token = get_valid_password_reset_token(db, email, code)
    if not db_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code invalide ou expiré.")
    user = update_user_password(db, db_token.user_id, new_password)
    delete_password_reset_token(db, db_token.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé après réinitialisation.")
    return {"message": "Mot de passe réinitialisé avec succès."}