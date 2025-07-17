from sqlalchemy.orm import Session, joinedload # Importation de joinedload
from sqlalchemy import or_ # Ajout pour la recherche si nécessaire

from app.models import Menu
from app.schemas import MenuBase # MenuBase peut ne pas être directement utilisé ici si tous les champs sont passés, mais c'est bien de l'avoir si besoin.
from typing import Optional # Ajout pour les types optionnels


# === Menus ===

def get_menus(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    """
    Récupère une liste de menus avec leurs catégories.
    Supporte la pagination et la recherche par nom/description.
    """
    query = db.query(Menu).options(joinedload(Menu.category)) # Charge la relation Category

    if search:
        query = query.filter(
            (Menu.name.ilike(f"%{search}%")) |
            (Menu.description.ilike(f"%{search}%"))
        )

    return query.offset(skip).limit(limit).all()

def get_menu(db: Session, menu_id: int):
    """Récupère un seul menu par son ID avec sa catégorie."""
    return db.query(Menu).options(joinedload(Menu.category)).filter(Menu.id == menu_id).first()

def create_menu(db: Session, menu: MenuBase):
    """Crée un nouveau menu."""
    db_menu = Menu(**menu.dict())
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu

def update_menu(db: Session, menu_id: int, menu: MenuBase):
    """Met à jour un menu existant (remplace tous les champs de MenuBase)."""
    db_menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not db_menu:
        return None
    for key, value in menu.dict().items():
        setattr(db_menu, key, value)
    db.commit()
    db.refresh(db_menu)
    return db_menu

def update_menu_fields(db: Session, menu_id: int, fields: dict):
    """Met à jour des champs spécifiques d'un menu."""
    db_menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not db_menu:
        return None
    for key, value in fields.items():
        setattr(db_menu, key, value)
    db.commit()
    db.refresh(db_menu)
    return db_menu

def toggle_boolean_field(db: Session, model, obj_id: int, field_name: str):
    """Bascule la valeur d'un champ booléen pour n'importe quel modèle."""
    obj = db.query(model).filter(model.id == obj_id).first()
    if not obj:
        return None

    current_value = getattr(obj, field_name, None)
    if not isinstance(current_value, bool):
        # Vous pouvez choisir de lever une erreur ou de logguer si le champ n'est pas booléen
        raise ValueError(f"Le champ '{field_name}' de l'objet {obj_id} n'est pas un booléen.")

    setattr(obj, field_name, not current_value)
    db.commit()
    db.refresh(obj)
    return obj

def toggle_favorite_menu(db: Session, menu_id: int):
    """Bascule le statut 'is_favorite' d'un menu."""
    return toggle_boolean_field(db, Menu, menu_id, "is_favorite")

def get_favorite_menus_with_categories(db: Session):
    """Récupère tous les menus favoris avec leurs informations de catégorie."""
    return db.query(Menu).options(joinedload(Menu.category)).filter(Menu.is_favorite == True).all()

def delete_menu(db: Session, menu_id: int):
    """Supprime un menu."""
    db_menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if db_menu:
        db.delete(db_menu)
        db.commit()
        return True
    return False

def count_menus(db: Session) -> int:
    return db.query(Menu).count()
