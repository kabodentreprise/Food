from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional

# Assurez-vous que ces imports sont corrects selon votre structure de projet
from app.schemas import OrderStatus, OrderOut, UserOut, UserUpdate
from services.order_services.crud_order import (
    get_livreur_assigned_orders,
    get_order_by_id,
    update_order_status,
    assign_livreur_to_order, # Maintenu au cas où il serait utilisé ailleurs par un admin
    get_available_orders_for_assignment,
    # --- NOUVELLES FONCTIONS DÉDIÉES AU LIVREUR ---
    update_order_status_to_en_chemin, # Fonction pour la prise en charge
    update_order_status_to_delivered # Fonction pour marquer comme livré
)
from services.user_services.crud_user import update_user_details
from app.session import get_db
from app.core.security import get_current_active_livreur

router = APIRouter(tags=["Livreur"])

@router.get("/orders/available", response_model=List[OrderOut])
def get_available_orders_for_livreur(
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Récupère les commandes qui sont au statut 'prêt' et ne sont pas encore assignées à un livreur.
    Ces commandes sont disponibles pour qu'un livreur les prenne en charge.
    """
    print(f"DEBUG BACKEND: [get_available_orders_for_livreur] Livreur {current_livreur.id} demande les commandes disponibles.")
    orders = get_available_orders_for_assignment(db)
    print(f"DEBUG BACKEND: [get_available_orders_for_livreur] {len(orders)} commandes disponibles trouvées.")
    return [OrderOut.model_validate(order) for order in orders]

@router.get("/orders/my-current", response_model=List[OrderOut])
def get_my_current_orders(
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Récupère les commandes actuellement assignées au livreur connecté et qui sont :
    - 'prêt' (disponibles pour être prises en charge, mais déjà assignées si elles proviennent d'un admin)
    - 'en_chemin' (en cours de livraison par le livreur)
    """
    print(f"DEBUG BACKEND: [get_my_current_orders] Livreur {current_livreur.id} demande ses commandes actuelles.")
    orders = get_livreur_assigned_orders(
        db,
        livreur_id=current_livreur.id,
        # Inclure les statuts 'prêt' et 'en_chemin'
        statuses=[OrderStatus.PRET.value, OrderStatus.EN_CHEMIN.value]
    )
    print(f"DEBUG BACKEND: [get_my_current_orders] {len(orders)} commandes actuelles trouvées pour le livreur {current_livreur.id}.")
    return [OrderOut.model_validate(order) for order in orders]

@router.get("/orders/history", response_model=List[OrderOut])
def get_livreur_delivery_history(
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Récupère l'historique des commandes livrées ou annulées par le livreur connecté.
    """
    print(f"DEBUG BACKEND: [get_livreur_delivery_history] Livreurs {current_livreur.id} demande son historique de livraison.")
    orders = get_livreur_assigned_orders(
        db,
        livreur_id=current_livreur.id,
        statuses=[OrderStatus.LIVRE.value, OrderStatus.ANNULEE.value] # Inclure 'ANNULEE' pour l'historique des échecs de livraison
    )
    print(f"DEBUG BACKEND: [get_livreur_delivery_history] {len(orders)} commandes historiques trouvées pour le livreur {current_livreur.id}.")
    return [OrderOut.model_validate(order) for order in orders]


@router.put("/orders/{order_id}/take", response_model=OrderOut)
def take_order_as_livreur(
    order_id: int,
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Permet au livreur de prendre une commande disponible ('prêt') et de se l'assigner,
    changeant son statut à 'en_chemin'.
    """
    print(f"DEBUG BACKEND: [take_order_as_livreur] Requête pour prendre la commande {order_id} par le livreur {current_livreur.id}")
    order = get_order_by_id(db, order_id) # Obtenez la commande pour les vérifications initiales

    if not order:
        print(f"DEBUG BACKEND: [take_order_as_livreur] Erreur 404: Commande {order_id} non trouvée.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée."
        )

    print(f"DEBUG BACKEND: [take_order_as_livreur] Statut actuel de la commande {order_id}: '{order.status}'")
    # Une commande peut être prise si elle est 'prêt'
    if order.status != OrderStatus.PRET.value: # Utilisez .value pour la comparaison
        print(f"DEBUG BACKEND: [take_order_as_livreur] Erreur 400: La commande {order_id} n'est pas au statut 'prêt'. Actuel: '{order.status}'")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cette commande n'est pas au statut 'prêt' (actuel: '{order.status}') et ne peut pas être prise."
        )

    # S'assurer que la commande n'est pas déjà assignée à quelqu'un d'autre (ou est déjà assignée à ce livreur)
    if order.assigned_livreur_id is not None and order.assigned_livreur_id != current_livreur.id:
        print(f"DEBUG BACKEND: [take_order_as_livreur] Erreur 400: La commande {order_id} est déjà assignée à un autre livreur ({order.assigned_livreur_id}).")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette commande est déjà assignée à un autre livreur."
        )
    
    # Si la commande est déjà assignée à ce livreur et est 'prêt', pas de problème, on la marque 'en_chemin'
    # Sinon, on l'assigne et on la marque 'en_chemin'

    print(f"DEBUG BACKEND: [take_order_as_livreur] Appel de update_order_status_to_en_chemin pour la commande {order_id} par le livreur {current_livreur.id}")
    # Utilisez la fonction dédiée pour le livreur qui prend la commande
    updated_order = update_order_status_to_en_chemin(
        db,
        order_id,
        current_livreur.id
    )

    if not updated_order:
        print(f"DEBUG BACKEND: [take_order_as_livreur] Erreur interne 500: update_order_status_to_en_chemin n'a pas retourné de commande mise à jour pour {order_id}.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la prise en charge de la commande."
        )

    print(f"DEBUG BACKEND: [take_order_as_livreur] Commande {order_id} mise à jour avec succès. Nouveau statut: '{updated_order.status}'")
    return OrderOut.model_validate(updated_order)


@router.put("/orders/{order_id}/deliver", response_model=OrderOut)
def mark_order_as_delivered(
    order_id: int,
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Marque une commande comme 'livrée'.
    Le livreur ne peut marquer comme livrée que les commandes qui lui sont assignées
    et qui sont au statut 'en_chemin'.
    """
    print(f"DEBUG BACKEND: [mark_order_as_delivered] Requête pour livrer la commande {order_id} par le livreur {current_livreur.id}")
    order = get_order_by_id(db, order_id)

    if not order:
        print(f"DEBUG BACKEND: [mark_order_as_delivered] Erreur 404: Commande {order_id} non trouvée.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée."
        )

    if order.assigned_livreur_id != current_livreur.id:
        print(f"DEBUG BACKEND: [mark_order_as_delivered] Erreur 403: Commande {order_id} non assignée à ce livreur.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier le statut de cette commande (non assignée à vous)."
        )

    # La commande doit être 'en_chemin' pour être livrée
    if order.status != OrderStatus.EN_CHEMIN.value:
        print(f"DEBUG BACKEND: [mark_order_as_delivered] Erreur 400: La commande {order_id} n'est pas au statut 'en_chemin'. Statut actuel: '{order.status}'")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La commande n'est pas dans un statut pouvant être marqué comme 'livrée'. Statut actuel: '{order.status}'"
        )

    print(f"DEBUG BACKEND: [mark_order_as_delivered] Appel de update_order_status_to_delivered pour la commande {order_id}")
    updated_order = update_order_status_to_delivered(db, order_id, current_livreur.id)

    if not updated_order:
        print(f"DEBUG BACKEND: [mark_order_as_delivered] Erreur interne 500: Échec de la mise à jour du statut pour la commande {order_id}.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la mise à jour du statut de la commande."
        )
    print(f"DEBUG BACKEND: [mark_order_as_delivered] Commande {order_id} mise à jour avec succès. Nouveau statut: '{updated_order.status}'")
    return OrderOut.model_validate(updated_order)


@router.put("/orders/{order_id}/failed-delivery", response_model=OrderOut)
def mark_order_as_failed_delivery(
    order_id: int,
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Marque une commande comme 'tentative de livraison échouée'.
    Le livreur ne peut marquer que les commandes qui lui sont assignées
    et qui sont au statut 'en_chemin'.
    """
    print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Requête pour marquer l'échec de livraison pour la commande {order_id} par le livreur {current_livreur.id}")
    order = get_order_by_id(db, order_id)

    if not order:
        print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Erreur 404: Commande {order_id} non trouvée.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée."
        )

    if order.assigned_livreur_id != current_livreur.id:
        print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Erreur 403: Commande {order_id} non assignée à ce livreur.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier le statut de cette commande (non assignée à vous)."
        )

    # La livraison peut échouer si la commande est 'en_chemin'
    if order.status != OrderStatus.EN_CHEMIN.value:
        print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Erreur 400: La commande {order_id} n'est pas au statut 'en_chemin'. Statut actuel: '{order.status}'")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La commande n'est pas au statut 'en chemin'. Statut actuel: '{order.status}'"
        )

    # Idéalement, vous auriez un statut `OrderStatus.ECHEC_LIVRAISON`.
    # Pour l'instant, on utilise `ANNULEE` comme convenu, mais c'est moins précis.
    print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Tentative de mise à jour du statut de la commande {order_id} à {OrderStatus.ANNULEE.value} (échec livraison)")
    # Utilisez la fonction update_order_status générale pour marquer comme annulée
    updated_order = update_order_status(db, order_id, OrderStatus.ANNULEE, actor_email=current_livreur.email, role="livreur")

    if not updated_order:
        print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Erreur interne 500: Échec de la mise à jour du statut pour la commande {order_id}.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la mise à jour du statut de la commande."
        )
    print(f"DEBUG BACKEND: [mark_order_as_failed_delivery] Commande {order_id} mise à jour avec succès. Nouveau statut: '{updated_order.status}'")
    return OrderOut.model_validate(updated_order)


@router.get("/profile", response_model=UserOut)
def get_livreur_profile(current_livreur: UserOut = Depends(get_current_active_livreur)):
    """
    Récupère le profil du livreur connecté.
    """
    print(f"DEBUG BACKEND: [get_livreur_profile] Demande de profil pour le livreur {current_livreur.id}.")
    return current_livreur

@router.put("/profile", response_model=UserOut)
def update_livreur_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_livreur: UserOut = Depends(get_current_active_livreur)
):
    """
    Met à jour le profil du livreur connecté.
    """
    print(f"DEBUG BACKEND: [update_livreur_profile] Mise à jour du profil pour le livreur {current_livreur.id}.")
    updated_user = update_user_details(db, current_livreur.id, user_update.model_dump(exclude_unset=True))

    if not updated_user:
        print(f"DEBUG BACKEND: [update_livreur_profile] Erreur interne 500: Échec de la mise à jour du profil pour le livreur {current_livreur.id}.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la mise à jour du profil."
        )
    print(f"DEBUG BACKEND: [update_livreur_profile] Profil du livreur {current_livreur.id} mis à jour avec succès.")
    return UserOut.model_validate(updated_user)