#from fastapi import FastAPI
#from fastapi.middleware.cors import CORSMiddleware
#from fastapi.staticfiles import StaticFiles

# Import des routeurs des endpoints de l'API nouvellement structurés
# from services.admin_services.routers import admin
#from services.livreur_services.routers import livreur
#from services.user_services.routers import user 
#from services.menu_services.routers import menu
#from services.order_services.routers import order
#from services.paiement_services.routers import paiement
#from services.super_admin_services.routers import super_admin
#from services.auth_services.routers import auth
#from services.categorie_services.routers import category



#app = FastAPI(
    #title="Restaurant API",
    #version="1.0.0"
#)

#Configuration CORS pour permettre l'accès depuis votre frontend (React, etc.)
#origins = [
    #"http://localhost",
    #"http://localhost:3000",
    #"http://127.0.0.1:3000",
#]

#app.add_middleware(
    #CORSMiddleware,
    #allow_origins=origins,
    #allow_credentials=True,
    #allow_methods=["*"],
    #allow_headers=["*"],
#)

# Montage du répertoire statique pour servir les images
#app.mount("/static", StaticFiles(directory="static"), name="static")

# Inclusion des routes API avec leurs préfixes logiques et leurs tags
#app.include_router(auth.router, prefix="/auth", tags=["Authentification"]) # REMARQUE : J'AI CHANGÉ LES PRÉFIXES ICI
#app.include_router(user.router, prefix="/user", tags=["Utilisateur (Profil)"]) # POUR UNE MEILLEURE CONVENTION REST
#app.include_router(livreur.router, prefix="/livreur", tags=["Livreur (Gestion des Commandes)"]) # Nouveau routeur pour les livreurs
#app.include_router(admin.router, prefix="/admin", tags=["Administration Générale"])
#app.include_router(super_admin.router, prefix="/super-admin", tags=["Super Administration (Utilisateurs)"])

# Inclusion des autres routeurs existants pour les menus, commandes, paiements
#app.include_router(menu.router, prefix="/menus", tags=["Menus"])
#app.include_router(category.router, prefix="/categories", tags=["Catégories"])
#app.include_router(order.router, prefix="/orders", tags=["Commandes"])
#app.include_router(paiement.router, prefix="/payments", tags=["Paiements"])

# Route d'accueil simple pour tester que l'API est fonctionnelle
#@app.get("/")
#def read_root():
#    return {"message": "Bienvenue sur l'API du Restaurant"}