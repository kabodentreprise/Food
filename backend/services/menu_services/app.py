# C:\Users\hp\nado\backend\services\menu_services\app.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.menu_services.routers.menu import router as menu_router
from fastapi.staticfiles import StaticFiles # Assurez-vous que c'est importé

import os # Ajout pour les chemins absolus

app = FastAPI(
    title="API Menu",
    description="Endpoints de gestion des menus",
    version="1.0.0"
)

# --- Configuration CORS pour ce microservice d'authentification ---
# Les origines que votre frontend est autorisé à appeler ce service
origins = [
    "http://localhost",
    "http://localhost:3000",      # L'URL de votre application frontend React
    "http://127.0.0.1:3000",      # Incluez ceci aussi par précaution
    # Ajoutez l'URL de production de votre frontend ici lorsque vous déployez
    # "https://votre-domaine-frontend-en-prod.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],      # Permet toutes les méthodes HTTP (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],      # Permet tous les en-têtes dans les requêtes
)
# --- Fin de la configuration CORS ---

# --- Montage des fichiers statiques ---
# Le 'directory' DOIT être le chemin absolu vers le dossier 'static' que vous voulez servir.
# Dans ce cas, nous voulons servir C:\Users\hp\nado\backend\static
STATIC_FILES_MOUNT_DIRECTORY = r"C:\Users\hp\nado\backend\static" # MODIFIÉ ICI

# Assurez-vous que le répertoire existe (si non, le mount échouera)
os.makedirs(STATIC_FILES_MOUNT_DIRECTORY, exist_ok=True)
print(f"DEBUG: Le répertoire monté pour /static est : {STATIC_FILES_MOUNT_DIRECTORY}")

app.mount("/static", StaticFiles(directory=STATIC_FILES_MOUNT_DIRECTORY), name="static")

# --- Inclure le routeur de menu ---
app.include_router(menu_router, prefix="/menu")

if __name__ == '__main__':
    import uvicorn
    # Important : assurez-vous que la commande uvicorn est lancée depuis
    # C:\Users\hp\nado\backend\ pour que le chemin 'services.menu_services.app:app' fonctionne
    uvicorn.run("services.menu_services.app:app", host="0.0.0.0", port=7005, reload=True)