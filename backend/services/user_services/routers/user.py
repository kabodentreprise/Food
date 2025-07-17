# app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends, Body, status
from sqlalchemy.orm import Session

from app.schemas import UserOut, UserUpdate
from services.user_services.crud_user import update_user_details, update_user_password
from app.session import get_db
from app.core.security import get_current_active_user # Dépendance pour s'assurer que le user est actif et connecté

router = APIRouter(tags=["Utilisateur (Profil)"])

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: UserOut = Depends(get_current_active_user)):
    """
    Récupère les informations du profil de l'utilisateur connecté.
    """
    return current_user

@router.put("/me", response_model=UserOut)
def update_users_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Met à jour les informations de profil de l'utilisateur connecté.
    Les champs sensibles (email, mot de passe, rôles, statut actif) ne peuvent PAS être modifiés via cette route.
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Champs que l'utilisateur standard N'A PAS le droit de modifier sur son propre profil
    # Ces modifications sont réservées aux super-administrateurs via les routes dédiées dans super_admin.py
    forbidden_fields = {
        "password", "is_active", "is_admin", "is_super_admin", "is_livreur"
    }

    for field in forbidden_fields:
        if field in update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le champ '{field}' ne peut pas être modifié via cette route. Veuillez contacter un administrateur."
            )

    # Si le mot de passe est fourni via ce DTO, il ne devrait pas être là,
    # mais par sécurité, on pourrait avoir une route spécifique "/me/password" si nécessaire.
    # Ici, on s'assure qu'il n'est pas traité par la mise à jour des détails.
    if "password" in update_data:
        del update_data["password"] # Supprime le mot de passe du dictionnaire de mise à jour pour éviter de le traiter ici

    updated_user = update_user_details(db, current_user.id, update_data)

    if not updated_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé ou erreur de mise à jour.")

    return updated_user

@router.put("/me/password", response_model=UserOut)
def update_my_password(
    new_password: str = Body(..., embed=True, min_length=8), # Utilisez Body avec embed=True pour un champ simple
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Permet à l'utilisateur connecté de modifier son propre mot de passe.
    """
    if not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le nouveau mot de passe ne peut pas être vide.")

    updated_user = update_user_password(db, current_user.id, new_password)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Échec de la mise à jour du mot de passe.")
    return updated_user