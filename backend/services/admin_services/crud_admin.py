from sqlalchemy.orm import Session
from app.models import Menu, Category, Order, User
from typing import Optional, List

# --- Gestion des menus (pour usage interne si besoin) ---
def get_menu_by_id(db: Session, menu_id: int) -> Optional[Menu]:
    return db.query(Menu).filter(Menu.id == menu_id).first()

# --- Gestion des catégories (pour usage interne si besoin) ---
def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()

# --- Gestion des commandes (pour usage interne si besoin) ---
def get_paid_orders(db: Session) -> List[Order]:
    """Retourne la liste des commandes ayant le statut 'payé'."""
    return db.query(Order).filter(Order.status == "payé").all()

def update_order_status(db: Session, order_id: int, status_value: str) -> Optional[Order]:
    """Met à jour le statut d'une commande (en preparation, prêt, annulé)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = status_value
    db.commit()
    db.refresh(order)
    return order

def assign_order_to_livreur(db: Session, order_id: int, livreur_id: int) -> Optional[Order]:
    """Assigne une commande à un livreur."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.assigned_livreur_id = livreur_id
    db.commit()
    db.refresh(order)
    return 

def get_all_livreurs(db: Session):
    """Retourne la liste de tous les livreurs."""
    return db.query(User).filter(User.is_livreur == True).all()




