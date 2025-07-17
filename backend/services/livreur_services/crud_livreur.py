from sqlalchemy.orm import Session
from app.models import User, Order
from typing import Optional, List

# === Livreurs ===

def get_livreur_ready_orders(db: Session, livreur_id: int) -> List[Order]:
    """
    Retourne les commandes au statut 'prêt' assignées à ce livreur.
    """
    return db.query(Order).filter(
        Order.assigned_livreur_id == livreur_id,
        Order.status == "prêt"
    ).all()


def livreur_marque_commande_livree(db: Session, order_id: int, livreur_id: int) -> Optional[Order]:
    """
    Permet au livreur de marquer une commande comme 'livrée' si elle lui est assignée et au statut 'prêt'.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.assigned_livreur_id == livreur_id,
        Order.status == "prêt"
    ).first()
    if not order:
        return None
    order.status = "livré"
    db.commit()
    db.refresh(order)
    return order


def get_livreur_historique_livraisons(db: Session, livreur_id: int) -> List[Order]:
    """
    Retourne la liste des commandes livrées par ce livreur.
    """
    return db.query(Order).filter(
        Order.assigned_livreur_id == livreur_id,
        Order.status == "livré"
    ).all()