from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.user_services.routers.user import router as user_router

app = FastAPI(
    title="API Utilisateur",
    description="Endpoints de gestion du profil utilisateur",
    version="1.0.0"
)
# --- Configuration CORS pour ce microservice d'authentification ---
# Les origines que votre frontend est autorisé à appeler ce service
origins = [
    "http://localhost",
    "http://localhost:3000",  # L'URL de votre application frontend React
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permet toutes les méthodes HTTP (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permet tous les en-têtes dans les requêtes
)
# --- Fin de la configuration CORS ---

app.include_router(user_router, prefix="/users")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("user_services.app:app", host="0.0.0.0", port=7009, reload=True)