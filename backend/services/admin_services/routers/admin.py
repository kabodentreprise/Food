# backend/services/admin_services/routers/admin.py

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.session import get_db
from app.core.security import get_current_admin # Dépendance pour vérifier le rôle d'administrateur

# *** Assurez-vous d'importer vos modèles et schémas nécessaires ***
# Ces importations dépendent de l'emplacement de vos modèles et schémas.
# Ajustez les chemins d'importation si nécessaire.
from app.models import Order, User, OrderItem, Menu # Importez vos modèles Order et User
from app.schemas import OrderOut, UserOut, OrderUpdateStatus, OrderAssignLivreur, OrderStatus # Importez OrderStatus également pour la validation


router = APIRouter(tags=["Administration Générale"])

### Récupérer toutes les commandes "actives" (payées ou en préparation)

@router.get("/orders/active", response_model=List[OrderOut]) # CHANGÉ ICI: Nouveau chemin d'API
def get_active_orders( # CHANGÉ ICI: Nouveau nom de fonction
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Récupère toutes les commandes ayant le statut 'payé' ou 'en_preparation',
    avec les détails des utilisateurs et des menus.
    """
    # Utilisation de la session de base de données pour filtrer les commandes
    # et charger EAGERLY (par jointure) les relations nécessaires.
    orders = db.query(Order).filter(
        (Order.status == OrderStatus.PAYE) | (Order.status == OrderStatus.EN_PREPARATION) # CHANGÉ ICI: Filtre pour PAYE ou EN_PREPARATION
    ).options(
        joinedload(Order.user), # Charger les détails de l'utilisateur qui a passé la commande
        joinedload(Order.livreur_user), # Charger les détails de l'utilisateur livreur assigné
        joinedload(Order.items).joinedload(OrderItem.menu) # <--- CLÉ ICI: Charger les éléments de la commande et pour chaque élément, charger son menu associé
    ).all()

    # Si aucune commande n'est trouvée, retourner une liste vide (comme vous le faites déjà)
    if not orders:
        return []
        
    return orders

@router.get("/livreur", response_model=List[UserOut])
def get_livreurs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin) # S'assure que seul un admin y accède
):
    """
    Récupère la liste de tous les utilisateurs marqués comme livreurs.
    """
    # Filtrez les utilisateurs où 'is_livreur' est vrai
    livreurs = db.query(User).filter(User.is_livreur == True).all()
    if not livreurs:
        return []
    return livreurs

@router.put("/order/{order_id}/assign-livreur") # Modification ici: retire {livreur_id} du chemin
def assign_livreur_to_order(
    order_id: int,
    assignment_data: OrderAssignLivreur, # Reçoit les données via le corps de la requête
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Assigne un livreur spécifié à une commande.
    Le livreur_id est passé dans le corps de la requête.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    livreur = db.query(User).filter(User.id == assignment_data.livreur_id, User.is_livreur == True).first()
    if not livreur:
        raise HTTPException(status_code=404, detail="Livreur non trouvé ou n'est pas un livreur valide.")

    # Mettez à jour l'ID du livreur sur la commande
    order.assigned_livreur_id = assignment_data.livreur_id # CORRECTION CLÉ: Utilise assigned_livreur_id
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": f"Livreur {livreur.first_name} assigné à la commande {order.id}."}

@router.put("/order/{order_id}/status")
def update_order_status(
    order_id: int,
    new_status_data: OrderUpdateStatus, # Assurez-vous que ce schéma Pydantic existe (ex: {status: "en_preparation"})
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Met à jour le statut d'une commande.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    # La validation du statut se fait par Pydantic grâce à l'Enum OrderStatus
    # Si vous voulez ajouter une logique de transition (ex: pas de "livré" vers "en_attente"),
    # vous pouvez l'implémenter ici.
    
    # Correction : Accédez au champ 'status' de l'objet Pydantic
    order.status = new_status_data.status
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": f"Statut de la commande {order.id} mis à jour à '{order.status}'."}