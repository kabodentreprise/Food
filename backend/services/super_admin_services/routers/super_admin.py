# C:\Users\hp\nado\backend\services\super_admin_services\routers\super_admin.py

from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas import (
    UserOut, UserCreate, UserUpdate, OrderOut, 
    FooterSettingsOut, FooterSettingsUpdate, AboutContentOut,
)

from services.user_services.crud_user import (
    get_all_users, update_user_admin_status, update_user_super_admin_status,
    update_user_livreur_status, update_user_active_status,
    get_user_by_id, get_user_by_email, create_user, update_user_password
)
from services.order_services.crud_order import (
    get_all_orders, # <-- Utilisera la fonction get_all_orders existante et non renommée
    get_paid_orders_by_user,     
    update_order_status as crud_update_order_status 
)
from services.super_admin_services.crud_super_admin import crud_app_settings
from app.core.security import get_db, get_current_super_admin, get_current_admin_or_super_admin
from app.schemas import OrderStatus # Importation explicite de OrderStatus

router = APIRouter(tags=["Super Administration (Utilisateurs)", "Super Administration (Paramètres de l'application)", "Super Administration (Commandes)"]) 

# ... (Vos routes /users existantes ici, qui restent inchangées) ...

@router.get("/users", response_model=List[UserOut])
def list_all_users_sa(db: Session = Depends(get_db), super_admin: UserOut = Depends(get_current_super_admin)):
    """
    Récupère la liste de tous les utilisateurs.
    Seuls les super-administrateurs peuvent accéder à cette route.
    """
    return get_all_users(db)

@router.get("/users/{user_id}", response_model=UserOut)
def read_user_sa(user_id: int, db: Session = Depends(get_db), super_admin: UserOut = Depends(get_current_super_admin)):
    """Récupère les informations d'un utilisateur par son ID (accès super-admin)."""
    db_user = get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return UserOut.model_validate(db_user)

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_sa(user_in: UserCreate, db: Session = Depends(get_db), super_admin: UserOut = Depends(get_current_super_admin)):
    """
    Crée un nouvel utilisateur. Accessible par les super-administrateurs.
    Permet de définir les statuts is_active, is_admin, is_super_admin, is_livreur lors de la création.
    """
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="L'email est déjà enregistré.")

    new_user = create_user(
        db,
        user=user_in,
        is_active=user_in.is_active if user_in.is_active is not None else True,
        is_admin=user_in.is_admin if user_in.is_admin is not None else False,
        is_super_admin=user_in.is_super_admin if user_in.is_super_admin is not None else False,
        is_livreur=user_in.is_livreur if user_in.is_livreur is not None else False
    )
    return UserOut.model_validate(new_user)

@router.put("/users/{user_id}/set-admin-status", response_model=UserOut)
def set_admin_status_sa(
    user_id: int,
    is_admin: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Accorde ou retire le privilège d'administrateur à un utilisateur.
    Seuls les super-administrateurs peuvent modifier ce statut.
    """
    user_to_update = update_user_admin_status(db, user_id, is_admin)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user_to_update

@router.put("/users/{user_id}/set-super-admin-status", response_model=UserOut)
def set_super_admin_status_sa(
    user_id: int,
    is_super_admin: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Accorde ou retire le privilège de super-administrateur à un utilisateur.
    Seuls les super-administrateurs peuvent modifier ce statut.
    Attention: Ne pas désactiver votre propre statut de super-administrateur sans créer un autre super-admin.
    """
    if user_id == super_admin.id and not is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Un super-administrateur ne peut pas désactiver son propre statut de super-administrateur.")

    user_to_update = update_user_super_admin_status(db, user_id, is_super_admin)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user_to_update

@router.put("/users/{user_id}/set-livreur-status", response_model=UserOut)
def set_livreur_status_sa(
    user_id: int,
    is_livreur: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Accorde ou retire le privilège de livreur à un utilisateur.
    Seuls les super-administrateurs peuvent modifier ce statut.
    """
    user_to_update = update_user_livreur_status(db, user_id, is_livreur)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user_to_update

@router.put("/users/{user_id}/set-active-status", response_model=UserOut)
def set_active_status_sa(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Active ou désactive le compte d'un utilisateur.
    Seuls les super-administrateurs peuvent modifier ce statut.
    Un super-administrateur ne peut pas désactiver son propre compte.
    """
    if user_id == super_admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Un super administrateur ne peut pas désactiver son propre compte."
        )

    user_to_update = update_user_active_status(db, user_id, is_active)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user_to_update

@router.get("/about", response_model=AboutContentOut, tags=["Super Administration (Paramètres de l'application)"])
def get_about_content_sa(
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin) 
):
    """
    Récupère le contenu de la page "À propos".
    Initialise les paramètres si non existants.
    """
    crud_app_settings.initialize_footer_and_about_settings(db) 
    app_settings = crud_app_settings.get_about_content(db)
    if not app_settings:
        raise HTTPException(status_code=404, detail="Contenu 'À propos' non trouvé ou non initialisé.")
    return app_settings

@router.put("/about", response_model=AboutContentOut, tags=["Super Administration (Paramètres de l'application)"])
def update_about_content_sa(
    about_update: FooterSettingsUpdate, 
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Met à jour le contenu de la page "À propos".
    """
    crud_app_settings.initialize_footer_and_about_settings(db) 
    updated_settings = crud_app_settings.update_about_content(db, about_update)
    if not updated_settings:
        raise HTTPException(status_code=404, detail="Échec de la mise à jour du contenu 'À propos'.")
    return updated_settings


@router.get("/footer-contact", response_model=FooterSettingsOut, tags=["Super Administration (Paramètres de l'application)"])
def get_footer_contact_sa(
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin) 
):
    """
    Récupère les informations de contact du footer.
    Initialise les paramètres si non existants.
    """
    crud_app_settings.initialize_footer_and_about_settings(db) 
    app_settings = crud_app_settings.get_footer_settings(db)
    if not app_settings:
        raise HTTPException(status_code=404, detail="Informations de contact du footer non trouvées ou non initialisées.")
    return app_settings

@router.put("/footer-contact", response_model=FooterSettingsOut, tags=["Super Administration (Paramètres de l'application)"])
def update_footer_contact_sa(
    footer_update: FooterSettingsUpdate, 
    db: Session = Depends(get_db),
    super_admin: UserOut = Depends(get_current_super_admin)
):
    """
    Met à jour les informations de contact du footer.
    """
    crud_app_settings.initialize_footer_and_about_settings(db) 
    updated_settings = crud_app_settings.update_footer_settings(db, footer_update)
    if not updated_settings:
        raise HTTPException(status_code=404, detail="Échec de la mise à jour des informations de contact du footer.")
    return updated_settings

# NOUVELLES ROUTES POUR LA GESTION DES COMMANDES (MODIFIÉES ET AJOUTÉES)
@router.get("/orders", response_model=List[OrderOut], tags=["Super Administration (Commandes)"])
def list_all_orders_sa_route( # Renommé pour éviter le conflit avec la fonction crud
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_admin_or_super_admin) 
):
    """
    Récupère la liste de toutes les commandes avec les détails des utilisateurs et des articles.
    Accessible par les administrateurs et super-administrateurs.
    """
    orders = get_all_orders(db) # Appel à la fonction get_all_orders non renommée
    return orders

@router.get("/users/{user_id}/paid-orders", response_model=List[OrderOut], tags=["Super Administration (Commandes)"])
def get_user_paid_orders_route( 
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_admin_or_super_admin) 
):
    """
    Récupère les commandes payées d'un utilisateur spécifique.
    Accessible par les administrateurs et super-administrateurs.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    paid_orders = get_paid_orders_by_user(db, user_id)
    return paid_orders

@router.put("/orders/{order_id}/status", response_model=OrderOut, tags=["Super Administration (Commandes)"])
def update_order_status_sa_route( 
    order_id: int,
    new_status: str, 
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_admin_or_super_admin)
):
    """
    Met à jour le statut d'une commande.
    Accessible par les administrateurs et super-administrateurs.
    """
    try:
        status_enum = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Statut '{new_status}' invalide. Statuts valides : {[s.value for s in OrderStatus]}")

    updated_order = crud_update_order_status(db, order_id, status_enum, actor_email=current_user.email, role="admin")
    if not updated_order:
        raise HTTPException(status_code=404, detail="Commande non trouvée ou statut invalide pour la mise à jour.")
    return updated_order