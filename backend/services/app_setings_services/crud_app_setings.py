from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import FooterSettings
from app.schemas import (
    FooterSettingsOut,
    FooterSettingsUpdate,
    AboutContentOut
)


# --- Gestion des paramètres Footer et À propos (réservé super admin) ---
class CRUDAppSettings:
    """
    Classe pour gérer les opérations CRUD de l'enregistrement singleton FooterSettings,
    qui contient les données du footer et de la page "À propos".
    """

    def _get_singleton_settings(self, db: Session):
        """Récupère l'enregistrement singleton FooterSettings."""
        settings_entry = db.query(FooterSettings).filter(FooterSettings.id == 1).first()
        if not settings_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Les paramètres de l'application (footer/about) n'ont pas été initialisés dans la base de données. Veuillez contacter un super administrateur."
            )
        return settings_entry

    def get_about_content(self, db: Session) -> AboutContentOut:
        """Récupère le contenu de la page 'À propos'."""
        settings_entry = self._get_singleton_settings(db)
        return AboutContentOut(
            id=settings_entry.id,
            title=settings_entry.title,
            history_title=settings_entry.history_title,
            history_content=settings_entry.history_content,
            restaurant_today_title=settings_entry.restaurant_today_title,
            restaurant_today_content=settings_entry.restaurant_today_content,
            achievements_title=settings_entry.achievements_title,
            achievements_content=settings_entry.achievements_content,
        )

    def update_about_content(self, db: Session, update_data: FooterSettingsUpdate) -> AboutContentOut:
        """Met à jour les champs de la page 'À propos' (super admin uniquement)."""
        settings_entry = self._get_singleton_settings(db)
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(settings_entry, field, value)
        db.add(settings_entry)
        db.commit()
        db.refresh(settings_entry)
        return AboutContentOut(
            id=settings_entry.id,
            title=settings_entry.title,
            history_title=settings_entry.history_title,
            history_content=settings_entry.history_content,
            restaurant_today_title=settings_entry.restaurant_today_title,
            restaurant_today_content=settings_entry.restaurant_today_content,
            achievements_title=settings_entry.achievements_title,
            achievements_content=settings_entry.achievements_content,
        )

    def get_footer_settings(self, db: Session) -> FooterSettingsOut:
        """Récupère les paramètres du footer."""
        settings_entry = self._get_singleton_settings(db)
        return FooterSettingsOut.model_validate(settings_entry)

    def update_footer_settings(self, db: Session, update_data: FooterSettingsUpdate) -> FooterSettingsOut:
        """Met à jour les champs du footer (super admin uniquement)."""
        settings_entry = self._get_singleton_settings(db)
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(settings_entry, field, value)
        db.add(settings_entry)
        db.commit()
        db.refresh(settings_entry)
        return FooterSettingsOut.model_validate(settings_entry)

    def initialize_footer_and_about_settings(self, db: Session):
        """Initialise ou récupère l'enregistrement singleton FooterSettings."""
        settings_entry = db.query(FooterSettings).filter(FooterSettings.id == 1).first()
        if not settings_entry:
            default_settings = FooterSettings(
                id=1,
                address="123 Rue de la Gourmandise, Cotonou, Bénin",
                phone_number="+22997000000",
                email="contact@lytefood.com",
                title="Bienvenue chez Lytefood : Notre Histoire",
                history_title="Des Débuts Modestes aux Saveurs Inoubliables",
                history_content="Lytefood a vu le jour en 2010, né de la vision d'un passionné de gastronomie africaine désireux de partager les richesses culinaires du Bénin. Ce qui a débuté comme un petit stand de street food est rapidement devenu un restaurant apprécié, fondé sur la fraîcheur des ingrédients locaux et des recettes traditionnelles revisitées.",
                restaurant_today_title="Lytefood Aujourd'hui : Un Voyage Culinaire",
                restaurant_today_content="Aujourd'hui, Lytefood est une destination incontournable pour les amateurs de bonne chère. Nous offrons une carte variée, allant des classiques béninois aux créations modernes, le tout dans une ambiance conviviale et chaleureuse. Notre engagement envers la qualité et le service client reste notre priorité.",
                achievements_title="Nos Récompenses et Votre Fidélité",
                achievements_content="Nous sommes fiers d'avoir reçu le prix du 'Meilleur Restaurant de Cuisine Locale' en 2022 et d'être salués par la critique pour notre innovation. Mais notre plus grande réussite reste la fidélité de nos clients, qui nous poussent chaque jour à nous surpasser. Merci de faire partie de l'aventure Lytefood !",
            )
            db.add(default_settings)
            db.commit()
            db.refresh(default_settings)
            return default_settings
        return settings_entry

# Instance à importer dans les routeurs super admin
crud_app_setings = CRUDAppSettings()