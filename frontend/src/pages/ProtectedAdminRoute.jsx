import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext"; // Importer le UserContext

const ProtectedAdminRoute = ({ children }) => {
  // Utiliser le contexte pour accéder aux informations de l'utilisateur et à l'état de chargement
  const { user, loadingUser } = useContext(UserContext); 

  // Si l'état de l'utilisateur est encore en cours de chargement, ne rien afficher ou un loader
  if (loadingUser) {
    return null; // Ou un composant de chargement (ex: <LoadingSpinner />)
  }

  // Si l'utilisateur n'est pas connecté, ou n'a pas de token, ou n'est pas admin, rediriger vers la page de connexion
  if (!user || !user.token || !user.is_admin) {
    // Utiliser 'replace' pour éviter que l'utilisateur puisse revenir à la page admin via le bouton retour du navigateur
    return <Navigate to="/login" replace />; 
  }

  // Si l'utilisateur est connecté et est admin, rendre les enfants de la route ou l'Outlet
  return children ? children : <Outlet />;
};

export default ProtectedAdminRoute;
