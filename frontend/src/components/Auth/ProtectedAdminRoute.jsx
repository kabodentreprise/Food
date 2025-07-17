import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext"; // Importer le UserContext
import { CircularProgress, Box, Typography } from "@mui/material"; // Pour un indicateur de chargement

const ProtectedAdminRoute = ({ children }) => {
  // Utiliser le contexte pour accéder aux informations de l'utilisateur et à l'état de chargement
  const { user, loadingUser, isAdmin } = useContext(UserContext); 

  // Si l'état de l'utilisateur est encore en cours de chargement, afficher un loader
  if (loadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress size={60} sx={{ color: '#E65100' }} />
        <Typography variant="h6" sx={{ mt: 3, color: '#8B4513' }}>
          Vérification des autorisations Admin...
        </Typography>
      </Box>
    );
  }

  // Si l'utilisateur n'est pas connecté, ou n'est pas admin, rediriger vers la page de connexion
  // Utiliser 'replace' pour éviter que l'utilisateur puisse revenir à la page précédente via le bouton retour du navigateur
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />; 
  }

  // Si l'utilisateur est connecté et est admin, rendre les enfants de la route ou l'Outlet
  return children ? children : <Outlet />;
};

export default ProtectedAdminRoute;
