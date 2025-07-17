import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from '../../contexts/UserContext';

// Import des composants Material-UI
import {
    AppBar,
    Toolbar,
    Button,
    Box,
    Typography,
} from "@mui/material";

// Import des icônes Material-UI
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining'; // Icône principale livreur
import AssignmentIcon from '@mui/icons-material/Assignment'; // Pour commandes actives (disponibles et en cours)
import HistoryIcon from '@mui/icons-material/History'; // Pour historique
import LogoutIcon from '@mui/icons-material/Logout';
import LaunchIcon from '@mui/icons-material/Launch';

const LivreurLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = React.useContext(UserContext);

    // Fonction utilitaire pour déterminer si un lien est actif
    const isActive = (path) => {
        // Pour le tableau de bord principal du livreur (onglet "Actives")
        if (path === '/livreur/dashboard?tab=active') {
            // Est actif si le chemin commence par /livreur et que le tab est 'active'
            // ou si aucun tab n'est spécifié (ce qui charge 'active' par défaut)
            const params = new URLSearchParams(location.search);
            const tabParam = params.get('tab');
            return location.pathname.startsWith('/livreur') && (tabParam === 'active' || !tabParam);
        }
        // Pour l'onglet historique, on vérifie spécifiquement le paramètre tab
        return location.pathname.startsWith('/livreur') && new URLSearchParams(location.search).get('tab') === path.split('=').pop();
    };

    const handleLogout = () => {
        logout(); // Utilise la fonction logout de UserContext
    };

    // Style de base pour les boutons de navigation pour inclure les icônes
    const navButtonStyle = (path) => ({
        color: isActive(path) ? '#FFD700' : '#fff', // Or si actif, blanc sinon
        fontWeight: isActive(path) ? 'bold' : 'normal',
        textDecoration: 'none',
        borderBottom: isActive(path) ? '2px solid #FFD700' : 'none', // Bordure inférieure pour l'actif
        borderRadius: 0, // Enlever le border-radius par défaut des boutons pour la bordure inférieure
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

    // Styles spécifiques pour les boutons de déconnexion et retour site
    const logoutButtonStyle = {
        ...navButtonStyle('/'), // Utilise une route non active pour le style de base
        color: '#fff',
        '&:hover': {
            backgroundColor: 'rgba(255, 0, 0, 0.1)', // Rouge léger au survol
            color: '#FF4C4C', // Rouge pour le texte
            borderBottom: '2px solid #FF4C4C',
        },
    };

    const returnToSiteButtonStyle = {
        ...navButtonStyle('/'), // Utilise une route non active pour le style de base
        color: '#fff',
        '&:hover': {
            backgroundColor: 'rgba(0, 255, 0, 0.1)', // Vert léger au survol
            color: '#4CAF50', // Vert pour le texte
            borderBottom: '2px solid #4CAF50',
        },
    };


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* HEADER / AppBar */}
            <AppBar position="sticky" sx={{ backgroundColor: "#3E2723", boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.4)' }}>
                <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
                    {/* Logo / Titre du site Livreur */}
                    <Link to="/livreur/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: "bold",
                                color: "#FFD700", // Couleur or pour Lytefood Livreur
                                letterSpacing: 1.5,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                mr: { xs: 2, sm: 4 }, // Marge à droite du titre (responsif)
                            }}
                        >
                            <DeliveryDiningIcon sx={{ mr: 1 }} /> Lytefood Livreur
                        </Typography>
                    </Link>

                    {/* Liens de navigation centraux pour le Livreur */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: { sm: '1rem', md: '2rem' }, alignItems: "center" }}>
                        {/* Bouton pour les Commandes Actives (fusionne disponibles et en cours) */}
                        <Button
                            component={Link}
                            to="/livreur/dashboard?tab=active"
                            sx={navButtonStyle('/livreur/dashboard?tab=active')}
                        >
                            <AssignmentIcon />
                            Actives
                        </Button>
                        {/* Ce bouton "Mes Commandes" a été supprimé ici */}
                        <Button
                            component={Link}
                            to="/livreur/dashboard?tab=history"
                            sx={navButtonStyle('/livreur/dashboard?tab=history')}
                        >
                            <HistoryIcon />
                            Historique
                        </Button>
                    </Box>

                    {/* Boutons d'action à droite */}
                    <Box sx={{ display: "flex", gap: { xs: '0.5rem', sm: '1rem' }, alignItems: "center", ml: "auto" }}>
                        <Button
                            onClick={handleLogout}
                            sx={logoutButtonStyle}
                        >
                            <LogoutIcon sx={{ mr: { xs: 0, sm: 0.5 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Déconnexion</Box>
                        </Button>
                        <Button
                            component={Link}
                            to="/"
                            sx={returnToSiteButtonStyle}
                        >
                            <LaunchIcon sx={{ mr: { xs: 0, sm: 0.5 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Retour site</Box>
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* MAIN CONTENT */}
            <Box component="main" sx={{ padding: { xs: "1rem", sm: "1.5rem", md: "2rem" }, backgroundColor: "#FDF5E6", flexGrow: 1 }}>
                <Outlet /> {/* Ceci affichera le contenu spécifique de la page, comme LivreurDashboard */}
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
                    © {new Date().getFullYear()} Lytefood Livreur. Tous droits réservés.
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Version 1.0.0 | Développé avec 🧡 au Bénin.
                </Typography>
            </Box>
        </Box>
    );
};

export default LivreurLayout;