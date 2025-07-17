from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.schemas import OrderCreate, OrderOut, OrderStatus, UserOut
from app.models import User, Order, Menu # Note: Order n'est plus directement utilisé ici pour OrderStatus
from app.session import get_db
from app.core.security import get_current_user
from services.order_services.crud_order import (
    create_order,
    get_order,
    get_orders_by_user,
    update_order_status,
    avancer_statut_commande,
    annuler_commande,
    assign_livreur_to_order, # Gardez cette fonction si elle est utilisée ailleurs (ex: admin)
    get_available_orders_for_assignment,
    get_orders_by_statuses_for_admin,
    # Importez les nouvelles fonctions du CRUD dédiées au livreur ici
    update_order_status_to_en_chemin,
    update_order_status_to_delivered,
    get_livreur_current_orders,
    get_livreur_history_orders
)
from services.menu_services.crud_menu import get_menu # Nécessaire pour valider les menus dans le routeur

router = APIRouter(tags=["Commandes"])

# ✅ Création de commande
@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED, summary="Créer une nouvelle commande")
def create_new_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items_for_crud = []
    for item in order_data.items:
        menu = get_menu(db, item.menu_id)
        if not menu:
            raise HTTPException(404, f"Menu #{item.menu_id} introuvable.")
        items_for_crud.append({"menu_id": item.menu_id, "quantity": item.quantity})

    create_order_kwargs = {
        "db": db,
        "user_id": current_user.id,
        "items": items_for_crud,
        "delivery_address": order_data.delivery_address,
    }

    if hasattr(order_data, 'assigned_livreur_id') and order_data.assigned_livreur_id is not None:
        create_order_kwargs["assigned_livreur_id"] = order_data.assigned_livreur_id
    
    # C'est ici que nous nous assurons de passer l'instance OrderStatus directement
    # si elle est fournie, sinon le CRUD prendra sa valeur par défaut.
    if order_data.status is not None: # Vérifier si le statut a été explicitement fourni
        create_order_kwargs["status"] = order_data.status

    order = create_order(**create_order_kwargs)

    return order

# ✅ Liste des commandes de l'utilisateur connecté
@router.get("/my-orders", response_model=List[OrderOut], summary="Obtenir les commandes de l'utilisateur actuel")
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_orders_by_user(db, current_user.id)


# ✅ Lecture d'une commande spécifique
@router.get("/{order_id}", response_model=OrderOut, summary="Obtenir une commande par ID")
def read_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(404, "Commande non trouvée")

    # Vérification des autorisations : client, admin, super_admin, ou livreur assigné
    if current_user.id != order.user_id and \
        not current_user.is_admin and \
        not current_user.is_super_admin and \
        (current_user.is_livreur and current_user.id != order.assigned_livreur_id): # L'accès pour les livreurs est géré dans leurs propres routeurs
        raise HTTPException(403, "Accès interdit à cette commande.")

    return order


# ✅ Mise à jour de statut (admin ou livreur assigné)
@router.put("/{order_id}/status", response_model=OrderOut, summary="Mettre à jour le statut d'une commande (Admin/Livreur)")
def update_status(
    order_id: int,
    new_status: OrderStatus, # C'est un Enum de Pydantic
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(404, "Commande non trouvée")

    actor_email = current_user.email
    role = "client" # Rôle par défaut, sera mis à jour si admin ou livreur

    # Admins ou Super-Admins ont tous les droits
    if current_user.is_admin or current_user.is_super_admin:
        role = "admin"
        # Permettre aux admins de changer n'importe quel statut
        updated = update_order_status(db, order_id, new_status, actor_email=actor_email, role=role)
        if not updated:
            raise HTTPException(400, "Impossible de mettre à jour le statut de la commande.")
        return updated
    
    # Livreur assigné peut uniquement changer de statut spécifique
    if current_user.is_livreur and order.assigned_livreur_id == current_user.id:
        role = "livreur"
        # Logique pour les livreurs : ils ne peuvent pas utiliser ce endpoint pour "en_chemin" ou "livré"
        # Ils devraient utiliser les endpoints dédiés "/livreur/orders/{order_id}/take" et "/livreur/orders/{order_id}/deliver"
        # Ce endpoint est plus générique pour les admins.
        # Si un livreur tente d'utiliser ce endpoint pour autre chose que ce qu'il peut faire, refuser.
        raise HTTPException(403, "Les livreurs doivent utiliser les endpoints spécifiques de livraison (/livreur/orders/{order_id}/take ou /livreur/orders/{order_id}/deliver).")
    
    # Si l'utilisateur est le propriétaire de la commande et tente d'annuler
    if current_user.id == order.user_id:
        if new_status == OrderStatus.ANNULEE:
            updated = annuler_commande(db, order_id, user_id=current_user.id, is_admin=False)
            if not updated:
                raise HTTPException(400, "La commande ne peut pas être annulée à ce stade ou n'est pas votre commande.")
            return updated
        else:
            raise HTTPException(403, "Les clients ne peuvent qu'annuler leurs propres commandes (si éligibles).")

    raise HTTPException(403, "Non autorisé à modifier cette commande.")


# ✅ Annulation commande (client/admin)
@router.put("/{order_id}/cancel", response_model=OrderOut, summary="Annuler une commande")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # La fonction annuler_commande gère déjà la logique d'autorisation (client vs admin)
    order = annuler_commande(db, order_id, user_id=current_user.id, is_admin=(current_user.is_admin or current_user.is_super_admin))
    if not order:
        raise HTTPException(400, "Commande non annulable (statut actuel ou autorisations).")
    return order


# ✅ Avancement automatique du statut
@router.put("/{order_id}/progress", response_model=OrderOut, summary="Avancer le statut d'une commande (workflow)", description="Passe la commande au statut suivant dans le workflow prédéfini (Admin/Système).")
def advance_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Typage correct de current_user
):
    # Cette route est généralement pour les admins ou des appels système/webhook
    if not current_user.is_admin and not current_user.is_super_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs.")

    order = avancer_statut_commande(db, order_id)
    if not order:
        raise HTTPException(400, "Impossible de faire avancer cette commande (statut final atteint ou non éligible).")
    return order


# ✅ Commandes assignées à un livreur (pour le livreur lui-même)
@router.get("/livreur/my-current", response_model=List[OrderOut], summary="Obtenir les commandes en cours du livreur actuel")
def get_my_current_orders(
    current_user: User = Depends(get_current_user), # Utilisez get_current_user et vérifiez le rôle
    db: Session = Depends(get_db)
):
    if not current_user.is_livreur:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux livreurs.")
    orders = get_livreur_current_orders(db, livreur_id=current_user.id)
    return orders

@router.get("/livreur/history", response_model=List[OrderOut], summary="Obtenir l'historique des commandes livrées par le livreur actuel")
def get_livreur_past_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_livreur:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux livreurs.")
    orders = get_livreur_history_orders(db, livreur_id=current_user.id)
    return orders

# ✅ NOUVEL ENDPOINT : Marquer une commande comme "en chemin" par le livreur
@router.put("/livreur/orders/{order_id}/take", response_model=OrderOut, summary="Marquer une commande comme 'en chemin' (Livreur)")
def take_order_by_livreur(
    order_id: int,
    current_user: User = Depends(get_current_user), # Utilisez get_current_user et vérifiez le rôle
    db: Session = Depends(get_db)
):
    if not current_user.is_livreur:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux livreurs.")

    updated_order = update_order_status_to_en_chemin(db, order_id=order_id, livreur_id=current_user.id)

    if not updated_order:
        order_db = get_order(db, order_id)
        if not order_db:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Commande non trouvée.")
        if order_db.assigned_livreur_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas assigné à cette commande.")
        if order_db.status != OrderStatus.PRET.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La commande n'est pas prête à être prise en charge. Statut actuel: {order_db.status}")
        # Si aucune des conditions ci-dessus, il y a un problème inattendu
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur interne lors de la prise en charge de la commande.")

    return updated_order

# ✅ NOUVEL ENDPOINT : Marquer une commande comme "livrée" par le livreur
@router.put("/livreur/orders/{order_id}/deliver", response_model=OrderOut, summary="Marquer une commande comme 'livrée' (Livreur)")
def deliver_order_by_livreur(
    order_id: int,
    current_user: User = Depends(get_current_user), # Utilisez get_current_user et vérifiez le rôle
    db: Session = Depends(get_db)
):
    if not current_user.is_livreur:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux livreurs.")
    
    updated_order = update_order_status_to_delivered(db, order_id=order_id, livreur_id=current_user.id)

    if not updated_order:
        order_db = get_order(db, order_id)
        if not order_db:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Commande non trouvée.")
        if order_db.assigned_livreur_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas assigné à cette commande.")
        if order_db.status not in [OrderStatus.EN_CHEMIN.value, OrderStatus.PRET.value]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La commande n'est pas en cours de livraison ou prête. Statut actuel: {order_db.status}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur interne lors de la livraison de la commande.")

    return updated_order


# ✅ Commandes disponibles (admin uniquement)
@router.get("/available-for-assignment", response_model=List[OrderOut], summary="Obtenir les commandes disponibles pour assignation (Admin)")
def list_unassigned_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and not current_user.is_super_admin:
        raise HTTPException(403, "Accès réservé aux administrateurs.")
    return get_available_orders_for_assignment(db)


# ✅ Assignation d'une commande à un livreur
@router.put("/{order_id}/assign-livreur/{livreur_id}", response_model=OrderOut, summary="Assigner une commande à un livreur (Admin)")
def assign_order(
    order_id: int,
    livreur_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin and not current_user.is_super_admin:
        raise HTTPException(403, "Action réservée aux administrateurs.")

    livreur = db.query(User).filter(User.id == livreur_id, User.is_livreur == True).first()
    if not livreur:
        raise HTTPException(404, "Livreur non valide ou introuvable.")

    try:
        # Assigner avec le statut "PAYE" par défaut après assignation
        order = assign_livreur_to_order(db, order_id, livreur_id, new_status=OrderStatus.PAYE)
        if not order:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible d'assigner la commande. Elle n'existe pas ou est dans un état non assignable.")
        return order
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


# ✅ Liste des commandes (admin) + filtres
@router.get("/admin", response_model=List[OrderOut], summary="Obtenir toutes les commandes avec filtres (Admin)")
def all_orders_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[List[OrderStatus]] = Query(None) # Query prend bien une liste d'Enums
):
    if not current_user.is_admin and not current_user.is_super_admin:
        raise HTTPException(403, "Accès réservé aux administrateurs.")
    # Le CRUD prendra la liste d'OrderStatus et convertira en .value pour la requête DB
    return get_orders_by_statuses_for_admin(db, statuses=status_filter)