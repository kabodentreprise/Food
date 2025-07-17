# C:\Users\hp\nado\backend\services\super_admin_services\app.py (ou votre main app.py)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.app_setings_services.routers.app_setings import router as app_setings_router


app = FastAPI(
    title="API Super Admin",
    description="Endpoints de gestion super administrateur",
    version="1.0.0"
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(app_setings_router, prefix="/app_setings") # NOUVEAU : Inclure le routeur public

if __name__ == '__main__':
    import uvicorn
    # Si c'est un microservice, assurez-vous qu'il gère les deux types de routes
    uvicorn.run("services.app_setings_services.app:app", host="0.0.0.0", port=7010, reload=True)
    # Note: Si c'est votre application FastAPI principale qui inclut tous les routeurs
    # et que public.py est dans app/routers/, le chemin uvicorn pourrait être différent (ex: app.main:app)