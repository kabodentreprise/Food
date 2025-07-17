from sqlalchemy.orm import Session, joinedload # Importation de joinedload
from sqlalchemy import or_ # Ajout pour la recherche si nécessaire

from app.models import Category, Menu
from app.schemas import CategoryBase, MenuBase # MenuBase peut ne pas être directement utilisé ici si tous les champs sont passés, mais c'est bien de l'avoir si besoin.
from typing import Optional # Ajout pour les types optionnels

# === Catégories ===

def get_categories(db: Session):
    """Récupère toutes les catégories."""
    return db.query(Category).all()

def create_category(db: Session, category: CategoryBase):
    """Crée une nouvelle catégorie."""
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    """Supprime une catégorie par son ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if category:
        db.delete(category)
        db.commit()
        return True
    return False

def get_category_by_name(db: Session, name: str):
    """Récupère une catégorie par son nom."""
    return db.query(Category).filter(Category.name == name).first()

def update_category(db: Session, category_id: int, name: str):
    """Met à jour une catégorie."""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db_category.name = name
        db.commit()
        db.refresh(db_category)
    return db_category

def count_categories(db: Session) -> int:
    return db.query(Category).count()
