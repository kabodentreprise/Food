# C:\Users\hp\Documents\AfriqFood\backend\app\session.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import FooterSettings # Chemin vers votre fichier de modèles
# L'importation de FooterSettings est nécessaire si vous l'utilisez pour initialize_footer_and_about_settings.
# Assurez-vous que app.models existe et que FooterSettings y est défini.

# Utilise l'URL de la base de données construite dans settings.py
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Crée le moteur de la base de données. Il ne se connecte pas réellement ici, il prépare la connexion.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Configure la session locale pour interagir avec la base de données.
# La session n'est créée que lorsque SessionLocal() est appelée.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Définition de la classe de base pour vos modèles SQLAlchemy.
# Tous vos modèles (tables de la base de données) devront hériter de cette Base.
Base = declarative_base()

# --- Fonction de dépendance pour la base de données (pour FastAPI) ---
def get_db():
    """
    Dépendance FastAPI pour obtenir une session de base de données.
    Cette fonction crée une nouvelle session pour chaque requête et garantit sa fermeture.
    """
    db = SessionLocal() # Crée une nouvelle session de base de données
    try:
        yield db # Permet à FastAPI d'injecter cette session dans vos fonctions de route
    finally:
        db.close() # Assure que la session est fermée après la requête (même en cas d'erreur)