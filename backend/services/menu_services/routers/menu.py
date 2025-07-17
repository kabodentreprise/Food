# C:\Users\hp\nado\backend\services\menu_services\routers\menu.py

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form
import shutil
import os
from app.schemas import MenuOut, CategoryOut, UserOut, MenuBase, CategoryBase
from services.menu_services.crud_menu import get_menu, create_menu, update_menu_fields, delete_menu, toggle_favorite_menu
from services.categorie_services.crud_category import get_categories
from app.session import SessionLocal, get_db
from app.core.security import get_current_admin
from app.models import Menu, Category

router = APIRouter()

# 📁 Répertoire de stockage des images
# Le chemin absolu est plus sûr pour les chemins de système de fichiers
# Assurez-vous que C:\Users\hp\nado\backend\static\images\menus existe
UPLOAD_DIRECTORY = r"C:\Users\hp\nado\backend\static\images\menus"

# Assurez-vous que le répertoire existe
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
print(f"DEBUG: UPLOAD_DIRECTORY est défini sur : {UPLOAD_DIRECTORY}")

# === Catégories ===

@router.get("/categories", response_model=List[CategoryOut], tags=["Catégories"])
def list_categories(db: Session = Depends(get_db)):
    """Récupère toutes les catégories."""
    return get_categories(db)


# === Menus ===

@router.get("/", response_model=List[MenuOut], tags=["Menus"])
def list_menus(db: Session = Depends(get_db), search: Optional[str] = None):
    """
    Récupère la liste de tous les menus, avec option de recherche.
    Charge également les informations de catégorie pour chaque menu.
    """
    query = db.query(Menu).options(joinedload(Menu.category))

    if search:
        query = query.filter(
            (Menu.name.ilike(f"%{search}%")) | (Menu.description.ilike(f"%{search}%"))
        )
    return query.all()


@router.post("/", response_model= MenuOut, status_code=status.HTTP_201_CREATED, tags=["Menus"])
async def create_menu_api(
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Crée un nouveau menu (accès admin)."""
    # Gérer le nom de fichier unique et la sauvegarde
    extension = os.path.splitext(image.filename)[1]
    unique_filename = f"{os.urandom(16).hex()}{extension}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de sauvegarde de l'image : {e}")

    # L'image_url ne doit pas inclure le /static/ car il est déjà dans REACT_APP_STATIC_URL
    # et sera géré par le mount de FastAPI
    image_url = f"/images/menus/{unique_filename}" # MODIFIÉ ICI

    # Créer les données du menu pour le CRUD
    menu_data = MenuBase(
        name=name,
        price=price,
        description=description,
        category_id=category_id,
        image_url=image_url
    )

    return create_menu(db=db, menu=menu_data)

@router.put("/{menu_id}", response_model=MenuOut, tags=["Menus"])
async def update_menu_api(
    menu_id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Met à jour un menu existant (accès admin)."""
    db_menu = get_menu(db, menu_id)
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu non trouvé.")

    # Construire un dictionnaire des champs à mettre à jour
    update_data = {
        k: v for k, v in {
            "name": name,
            "price": price,
            "description": description,
            "category_id": category_id
        }.items() if v is not None
    }

    # Gérer la mise à jour de l'image si fournie
    if image:
        # Supprimer l'ancienne image si elle existe et est dans le bon répertoire
        # Nous vérifions si l'URL contient la partie de chemin que nous gérons.
        if db_menu.image_url and "/images/menus/" in db_menu.image_url:
            # Reconstruit le chemin absolu de l'ancienne image
            old_filename = os.path.basename(db_menu.image_url)
            old_path = os.path.join(UPLOAD_DIRECTORY, old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)
                print(f"DEBUG: Ancienne image supprimée: {old_path}")

        # Enregistrer la nouvelle image
        ext = os.path.splitext(image.filename)[1]
        new_filename = f"{os.urandom(16).hex()}{ext}"
        file_path = os.path.join(UPLOAD_DIRECTORY, new_filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            # L'image_url ne doit pas inclure le /static/
            update_data["image_url"] = f"/images/menus/{new_filename}" # MODIFIÉ ICI
            print(f"DEBUG: Nouvelle image sauvegardée à: {file_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur de sauvegarde de la nouvelle image : {e}")

    return update_menu_fields(db=db, menu_id=menu_id, fields=update_data)

@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Menus"])
def delete_menu_api(
    menu_id: int,
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin)
):
    """Supprime un menu (accès admin)."""
    db_menu = get_menu(db, menu_id)
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu non trouvé.")

    # Supprimer l'image associée si elle existe
    if db_menu.image_url and "/images/menus/" in db_menu.image_url:
        image_filename = os.path.basename(db_menu.image_url)
        image_path = os.path.join(UPLOAD_DIRECTORY, image_filename)
        if os.path.exists(image_path):
            os.remove(image_path)
            print(f"DEBUG: Image supprimée lors de la suppression du menu: {image_path}")

    deleted = delete_menu(db, menu_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression.")
    return {"message": "Menu supprimé avec succès."}

@router.get("/menus/count", response_model=int)
def count_menus(db: Session = Depends(get_db)):
    return db.query(Menu).count()


# === Favoris ===

@router.get("/favoris", response_model=List[MenuOut], tags=["Menus"])
def get_favorite_menus_api(db: Session = Depends(get_db)):
    """
    Récupère tous les menus marqués comme favoris.
    Charge également les informations de catégorie pour chaque menu.
    """
    # Utilise joinedload pour s'assurer que la catégorie est chargée pour le schéma MenuOut
    return db.query(Menu).options(joinedload(Menu.category)).filter(Menu.is_favorite == True).all()

@router.post("/{menu_id}/favoris", response_model= MenuOut, tags=["Menus"])
def toggle_favorite_menu_api(
    menu_id: int,
    db: Session = Depends(get_db),
    current_admin: UserOut = Depends(get_current_admin) # L'authentification admin est requise pour basculer les favoris
):
    """Bascule le statut favori d'un menu (accès admin)."""
    menu = toggle_favorite_menu(db, menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu non trouvé.")
    return menu