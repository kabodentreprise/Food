# C:\Users\hp\Documents\AfriqFood\backend\app\core\config.py
import os
from dotenv import load_dotenv
from pydantic import EmailStr, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict
from passlib.context import CryptContext
import sys

# Charge les variables d'environnement depuis le fichier .env
load_dotenv()

# Contexte pour le hachage des mots de passe (gardé ici, c'est le bon endroit)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Settings(BaseSettings):
    # Configure Pydantic pour lire les variables depuis le fichier .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Paramètres JWT pour l'authentification ---
    # Pydantic lira ces variables directement du .env grâce à BaseSettings
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # --- Configuration de la base de données PostgreSQL ---
    # Pydantic lira ces variables directement du .env
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str

    # --- Informations pour l'envoi d'e-mails ---
    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_USERNAME: EmailStr
    EMAIL_PASSWORD: str

    # --- Clés API pour le service de paiement Faydapay ---
    FEDAPAY_PUBLIC_KEY: str
    FEDAPAY_SECRET_KEY: str
    FEDAPAY_API_BASE_URL: str

    @property
    def DATABASE_URL(self) -> str:
        """
        Construit l'URL complète de la base de données à partir des variables individuelles.
        Utilise 'postgresql+psycopg2' pour le driver recommandé avec SQLAlchemy.
        """
        return (
            f"postgresql+psycopg2://{self.DATABASE_USER}:"
            f"{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:"
            f"{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

# Tente d'initialiser les paramètres de l'application
try:
    settings = Settings()
except ValidationError as e:
    print(f"Erreur de configuration de l'application: {e}")
    print("Veuillez vérifier que toutes les variables d'environnement requises sont définies dans votre fichier .env ou dans l'environnement système.")
    sys.exit(1)