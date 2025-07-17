from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form
import shutil
import os

from app.schemas import CategoryOut, UserOut, CategoryBase
from services.categorie_services.crud_category import get_categories, create_category, update_category, delete_category, get_category_by_name
from app.session import SessionLocal, get_db
from app.core.security import get_current_admin
from app.models import Category


router = APIRouter()



# 📁 Répertoire de stockage des images
UPLOAD_DIRECTORY = "./static/images/menus"
# Assurez-vous que le répertoire existe
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# === Catégories ===
@router.get("/count", response_model=int)
def count_categories(db: Session = Depends(get_db)):
    return db.query(Category).count()


@router.get("/", response_model=List[CategoryOut], tags=["Catégories"])
def list_categories(db: Session = Depends(get_db)):
    """Récupère toutes les catégories."""
    return get_categories(db)

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED, tags=["Catégories"])
def create_category_api(
    category: CategoryBase,
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Crée une nouvelle catégorie (accès admin)."""
    db_category = get_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà.")
    return create_category(db=db, category=category)

@router.put("/{category_id}", response_model=CategoryOut, tags=["Catégories"])
def update_category_api(
    category_id: int,
    category: CategoryBase,
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Met à jour une catégorie par son ID (accès admin)."""
    updated_category = update_category(db, category_id, category.name)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée.")
    return updated_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Catégories"])
def delete_category_api(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Supprime une catégorie par son ID (accès admin)."""
    deleted = delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée.")
    return {"message": "Catégorie supprimée avec succès."}

