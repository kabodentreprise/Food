# C:\Users\hp\nado\backend\services\order_services\crud_order.py

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Union
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func
from enum import Enum 
from app.models import Order, OrderItem, Menu, User, OrderHistory
from app.schemas import OrderItemBase, OrderStatus 

TVA_RATE = Decimal("0.18")

def create_order(
    db: Session,
    user_id: int,
    items: List[Dict[str, int]],
    delivery_address: str,
    status: Optional[OrderStatus] = OrderStatus.EN_ATTENTE,
    assigned_livreur_id: Optional[int] = None
) -> Order:
    total_before_tva = Decimal("0.00")
    order_items_to_add = []

    for item_data in items:
        menu = db.query(Menu).filter(Menu.id == item_data["menu_id"]).first()
        if not menu:
            raise ValueError(f"Menu with ID {item_data['menu_id']} not found.")
        
        quantity = item_data["quantity"]
        if quantity <= 0:
            raise ValueError(f"Quantity for menu {item_data['menu_id']} must be positive.")

        total_before_tva += Decimal(str(menu.price)) * quantity
        order_items_to_add.append(OrderItem(menu_id=menu.id, quantity=quantity))

    tva_amount = (total_before_tva * TVA_RATE).quantize(Decimal("0.01"))
    total_with_tva = (total_before_tva + tva_amount).quantize(Decimal("0.01"))

    db_order = Order(
        user_id=user_id,
        assigned_livreur_id=assigned_livreur_id,
        status=status.value, 
        total=total_with_tva,
        tva_amount=tva_amount,
        delivery_address=delivery_address,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_order)
    db.flush() 

    for order_item in order_items_to_add:
        order_item.order_id = db_order.id
        db.add(order_item)
    
    user_obj = db.query(User).filter(User.id == user_id).first()
    actor_email = user_obj.email if user_obj else "Client Inconnu"
    history_entry = OrderHistory(
        order_id=db_order.id,
        ancien_statut="N/A",
        nouveau_statut=db_order.status, 
        modifie_par=actor_email,
        role="client",
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)

    db.commit()
    db.refresh(db_order)

    # Chargement eager des relations pour la réponse du routeur
    db_order.items 
    if db_order.user_id: 
        db_order.user
    if db_order.assigned_livreur_id: 
        db_order.livreur_user

    return db_order


def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user), 
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).filter(Order.id == order_id).first()


def get_orders_by_user(db: Session, user_id: int) -> List[Order]:
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()


def get_all_orders(db: Session) -> List[Order]: # <-- Fonction conservée
    """
    Récupère toutes les commandes avec les détails du client, du livreur et des articles.
    Cette fonction est utile pour le tableau de bord général des commandes.
    """
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).order_by(Order.created_at.desc()).all()


def get_paid_orders_by_user(db: Session, user_id: int) -> List[Order]:
    """
    Récupère toutes les commandes "payées" pour un utilisateur spécifique.
    Charge également les informations de l'utilisateur et du livreur pour les commandes,
    ainsi que les articles de la commande (OrderItems) et leurs menus associés.
    """
    return db.query(Order).options(
        joinedload(Order.user), 
        joinedload(Order.livreur_user), 
        joinedload(Order.items).joinedload(OrderItem.menu) 
    ).filter(
        Order.user_id == user_id,
        Order.status == OrderStatus.PAYE.value 
    ).order_by(Order.created_at.desc()).all()


def update_order_status(
    db: Session,
    order_id: int,
    new_status: OrderStatus, 
    actor_email: Optional[str] = None,
    role: Optional[str] = None
) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order or order.status == new_status.value: 
        return None

    ancien_statut_str = order.status 

    order.status = new_status.value 
    order.updated_by = actor_email
    order.updated_at = datetime.utcnow()

    db.add(OrderHistory(
        order_id=order.id,
        ancien_statut=ancien_statut_str,
        nouveau_statut=order.status, 
        modifie_par=actor_email,
        role=role,
        timestamp=datetime.utcnow()
    ))

    db.commit()
    db.refresh(order)
    return order


def avancer_statut_commande(db: Session, order_id: int) -> Optional[Order]:
    workflow = [
        OrderStatus.EN_ATTENTE,
        OrderStatus.PAYE,
        OrderStatus.EN_PREPARATION,
        OrderStatus.PRET,
        OrderStatus.EN_CHEMIN, 
        OrderStatus.LIVRE
    ]
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order or order.status not in [s.value for s in workflow]:
        return None

    try:
        current_status_value = order.status
        idx = [s.value for s in workflow].index(current_status_value)
        
        if idx + 1 >= len(workflow):
            return None
        next_status = workflow[idx + 1] 
        return update_order_status(db, order.id, next_status, actor_email="system", role="auto")
    except ValueError:
        return None


def annuler_commande(db: Session, order_id: int, user_id: int = None, is_admin: bool = False) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    
    if order.status not in [OrderStatus.EN_ATTENTE.value, OrderStatus.PAYE.value]:
        return None

    if not is_admin and (user_id is None or user_id != order.user_id):
        return None

    user_obj = db.query(User).filter(User.id == user_id).first()
    actor_email = "admin" if is_admin else user_obj.email if user_obj else "Client Inconnu"
    role = "admin" if is_admin else "client"

    return update_order_status(db, order_id, OrderStatus.ANNULEE, actor_email=actor_email, role=role)


def assign_livreur_to_order(
    db: Session,
    order_id: int,
    livreur_id: int,
    new_status: Optional[OrderStatus] = OrderStatus.PAYE 
) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None

    livreur = db.query(User).filter(User.id == livreur_id, User.is_livreur == True).first()
    if not livreur:
        raise ValueError("Livreur non valide ou introuvable.")
    
    if order.status in [OrderStatus.LIVRE.value, OrderStatus.ANNULEE.value, OrderStatus.REMBOURSEE.value]:
        raise ValueError("Impossible d'assigner un livreur à une commande dans cet état.")

    if order.assigned_livreur_id == livreur_id:
        return order 

    order.assigned_livreur_id = livreur_id
    return update_order_status(db, order_id, new_status, actor_email="admin_assign", role="admin")


def get_orders_by_statuses_for_admin(db: Session, statuses: Optional[List[OrderStatus]] = None) -> List[Order]:
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user), 
        joinedload(Order.items).joinedload(OrderItem.menu)
    )
    if statuses:
        values = [s.value for s in statuses]
        query = query.filter(Order.status.in_(values))
    return query.order_by(Order.created_at.desc()).all()


def get_livreur_assigned_orders(db: Session, livreur_id: int, statuses: Optional[List[Union[str, OrderStatus]]] = None) -> List[Order]:
    query = db.query(Order).filter(Order.assigned_livreur_id == livreur_id)
    if statuses:
        values = [s.value if isinstance(s, OrderStatus) else s for s in statuses]
        query = query.filter(Order.status.in_(values))
    return query.options(
        joinedload(Order.user),
        joinedload(Order.livreur_user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).order_by(Order.created_at.desc()).all()


def get_available_orders_for_assignment(db: Session) -> List[Order]:
    return db.query(Order).filter(
        Order.assigned_livreur_id.is_(None),
        Order.status.in_([OrderStatus.EN_ATTENTE.value, OrderStatus.PAYE.value, OrderStatus.EN_PREPARATION.value])
    ).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).order_by(Order.created_at.desc()).all()

# --- NOUVELLES FONCTIONS POUR LE LIVREUR ---
def update_order_status_to_en_chemin(db: Session, order_id: int, livreur_id: int) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None

    if order.assigned_livreur_id != livreur_id:
        return None 

    if order.status != OrderStatus.PRET.value:
        return None

    user_obj = db.query(User).filter(User.id == livreur_id).first()
    actor_email = user_obj.email if user_obj else f"Livreur (ID: {livreur_id})"

    updated_order = update_order_status(db, order_id, OrderStatus.EN_CHEMIN, actor_email=actor_email, role="livreur")
    return updated_order


def update_order_status_to_delivered(db: Session, order_id: int, livreur_id: int) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    if order.assigned_livreur_id != livreur_id:
        return None 

    if order.status not in [OrderStatus.EN_CHEMIN.value, OrderStatus.PRET.value]:
        return None

    user_obj = db.query(User).filter(User.id == livreur_id).first()
    actor_email = user_obj.email if user_obj else f"Livreur (ID: {livreur_id})"

    updated_order = update_order_status(db, order_id, OrderStatus.LIVRE, actor_email=actor_email, role="livreur")
    return updated_order

def get_livreur_current_orders(db: Session, livreur_id: int) -> List[Order]:
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).filter(
        Order.assigned_livreur_id == livreur_id,
        Order.status.in_([OrderStatus.PRET.value, OrderStatus.EN_CHEMIN.value]) # Correction ici : Order.status au lieu de OrderStatus.status
    ).order_by(Order.created_at).all()

def get_livreur_history_orders(db: Session, livreur_id: int) -> List[Order]:
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.livreur_user),
        joinedload(Order.items).joinedload(OrderItem.menu)
    ).filter(
        Order.assigned_livreur_id == livreur_id,
        Order.status == OrderStatus.LIVRE.value
    ).order_by(Order.created_at.desc()).all() 


def count_orders(db: Session) -> int:
    return db.query(Order).count()


def get_total_revenue(db: Session) -> Decimal:
    total = db.query(func.sum(Order.total)).filter(Order.status == OrderStatus.LIVRE.value).scalar()
    return total if total is not None else Decimal("0.00")