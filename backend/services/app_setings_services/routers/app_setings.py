
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Assurez-vous que ces importations sont correctes par rapport à votre structure de projet
from services.app_setings_services.crud_app_setings import crud_app_setings
from app.schemas import AboutContentOut, FooterSettingsOut # Importez les schémas de réponse
from app.session import get_db

router = APIRouter(tags=["Paramètres d'Application Publics"])

@router.get("/about-content", response_model=AboutContentOut)
def get_public_about_content(db: Session = Depends(get_db)):
    """
    Récupère le contenu de la page 'À propos' pour le public.
    AUCUNE AUTHENTIFICATION REQUISE.
    """
    # Assure que les paramètres initiaux existent dans la base de données
    crud_app_setings.initialize_footer_and_about_settings(db)
    app_setings = crud_app_setings.get_about_content(db)
    if not app_setings:
        raise HTTPException(status_code=404, detail="Contenu 'À propos' non trouvé ou non initialisé.")
    return app_setings

@router.get("/footer-contact", response_model=FooterSettingsOut)
def get_public_footer_contact(db: Session = Depends(get_db)):
    """
    Récupère les informations de contact du footer pour le public.
    AUCUNE AUTHENTIFICATION REQUISE.
    """
    # Assure que les paramètres initiaux existent dans la base de données
    crud_app_setings.initialize_footer_and_about_settings(db)
    app_setings = crud_app_setings.get_footer_settings(db)
    if not app_setings:
        raise HTTPException(status_code=404, detail="Informations de contact du footer non trouvées ou non initialisées.")
    return app_setings