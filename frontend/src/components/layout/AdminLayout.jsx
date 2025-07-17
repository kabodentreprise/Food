import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

// Import des composants Material-UI
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
} from "@mui/material";

// Import des icônes Material-UI
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import LaunchIcon from '@mui/icons-material/Launch';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Nouvelle icône pour "Mes Commandes"

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fonction utilitaire pour déterminer si un lien est actif
  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Assurez-vous que c'est là où votre token est stocké
    navigate("/login");
  };

  // Style de base pour les boutons de navigation pour inclure les icônes
  const navButtonStyle = (path) => ({
    color: isActive(path) ? '#FFD700' : '#fff', // Or si actif, blanc sinon
    fontWeight: isActive(path) ? 'bold' : 'normal',
    textDecoration: 'none',
    borderBottom: isActive(path) ? '2px solid #FFD700' : 'none', // Bordure inférieure pour l'actif
    borderRadius: 0, // Enlever le border-radius par default des boutons pour la bordure inférieure
    paddingBottom: '6px', // Espacement pour la bordure inférieure
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Léger fond au survol
      color: '#FFD700', // Texte or au survol
      borderBottom: '2px solid #FFD700', // Bordure dorée au survol
    },
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textTransform: 'none', // Pour garder la première lettre en majuscule si vous le souhaitez
    minWidth: 'auto', // Permet aux boutons de s'adapter au contenu
    px: { xs: 1, sm: 2 }, // Padding horizontal responsif
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* HEADER / AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: "#3E2723", boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.4)' }}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          {/* Logo / Titre du site Admin */}
          <Link to="/admin" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: "bold",
                color: "#FFD700", // Couleur or pour Lytefood Admin
                letterSpacing: 1.5,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                mr: { xs: 2, sm: 4 }, // Marge à droite du titre (responsif)
              }}
            >
              Lytefood Admin
            </Typography>
          </Link>

          {/* Liens de navigation centraux */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: { sm: '1rem', md: '2rem' }, alignItems: "center" }}> {/* Cacher sur mobile, afficher à partir de md */}
            <Button
              component={Link}
              to="/admin"
              sx={navButtonStyle('/admin')}
            >
              <DashboardIcon />
              Dashboard
            </Button>
            <Button
              component={Link}
              to="/admin/menus"
              sx={navButtonStyle('/admin/menus')}
            >
              <RestaurantMenuIcon />
              Menus
            </Button>
            <Button
              component={Link}
              to="/admin/categories"
              sx={navButtonStyle('/admin/categories')}
            >
              <CategoryIcon />
              Catégories
            </Button>
            <Button // NOUVEAU BOUTON
              component={Link}
              to="/my-orders"
              sx={navButtonStyle('/my-orders')}
            >
              <AssignmentIcon />
              Mes Commandes
            </Button>
          </Box>

          {/* Boutons d'action à droite */}
          <Box sx={{ display: "flex", gap: { xs: '0.5rem', sm: '1rem' }, alignItems: "center", ml: "auto" }}>
            <Button
              onClick={handleLogout}
              sx={{
                ...navButtonStyle(), // Utilise la base du style de nav mais sans l'actif
                color: '#fff', // Override pour s'assurer que c'est blanc
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)', // Rouge léger au survol pour la déconnexion
                  color: '#FF4C4C', // Rouge pour le texte
                  borderBottom: '2px solid #FF4C4C',
                },
              }}
            >
              <LogoutIcon sx={{ mr: { xs: 0, sm: 0.5 } }} /> {/* Cache le texte sur mobile pour les icônes */}
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Déconnexion</Box>
            </Button>
            <Button
              component={Link}
              to="/"
              sx={{
                ...navButtonStyle(), // Utilise la base du style de nav mais sans l'actif
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 0, 0.1)', // Vert léger au survol pour le retour site
                  color: '#4CAF50', // Vert pour le texte
                  borderBottom: '2px solid #4CAF50',
                },
              }}
            >
              <LaunchIcon sx={{ mr: { xs: 0, sm: 0.5 } }} /> {/* Cache le texte sur mobile pour les icônes */}
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Retour site</Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box component="main" sx={{ padding: { xs: "1rem", sm: "1.5rem", md: "2rem" }, backgroundColor: "#FDF5E6", flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: { xs: 1, sm: 2, md: 3 },
          mt: 'auto', // Pousse le footer vers le bas
          backgroundColor: "#3E2723", // Même couleur que l'AppBar pour la cohérence
          color: "#FFD700", // Texte or
          textAlign: "center",
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', // Séparateur subtil
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.3)', // Ombre inversée
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Lytefood Admin. Tous droits réservés.
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Version 1.0.0 | Développé avec 🧡 au Bénin.
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminLayout;