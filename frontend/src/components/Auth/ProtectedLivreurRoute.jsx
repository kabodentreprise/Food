import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

const ProtectedLivreurRoute = ({ children }) => {
    // Assurez-vous que isSuperAdmin est disponible dans votre UserContext
    const { user, loading, isAuthenticated, isLivreur, isSuperAdmin } = React.useContext(UserContext);

    console.log("ProtectedLivreurRoute - État du UserContext:"); // AJOUTEZ CETTE LIGNE
    console.log("  loading:", loading); // AJOUTEZ CETTE LIGNE
    console.log("  isAuthenticated:", isAuthenticated); // AJOUTEZ CETTE LIGNE
    console.log("  user:", user); // AJOUTEZ CETTE LIGNE
    console.log("  isLivreur:", isLivreur); // AJOUTEZ CETTE LIGNE
    console.log("  isSuperAdmin:", isSuperAdmin); // AJOUTEZ CETTE LIGNE

    if (loading) {
        return <div>Chargement de l'accès livreur...</div>;
    }

    if (!isAuthenticated) {
        // Si l'utilisateur n'est pas authentifié, redirige vers la page de connexion
        return <Navigate to="/login" replace />;
    }

    // Si l'utilisateur est authentifié, vérifie s'il est un livreur OU un super administrateur
    // (un super administrateur a le droit de voir toutes les interfaces dédiées)
    const canAccessLivreurDashboard = user && (isLivreur || isSuperAdmin);

    if (!canAccessLivreurDashboard) {
        console.warn(`Accès non autorisé : L'utilisateur ${user?.email || 'inconnu'} n'est ni livreur ni super administrateur.`);
        // Redirige vers la page d'accueil ou une page d'accès refusé si non autorisé
        return <Navigate to="/" replace />;
    }

    // Si l'utilisateur est authentifié et autorisé, rend le contenu enfant
    return children ? children : <Outlet />;
};

export default ProtectedLivreurRoute;