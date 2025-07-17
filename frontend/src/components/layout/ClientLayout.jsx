import React, { useContext, useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext.jsx";
import axios from 'axios';

// --- Import des icônes Material-UI ---
import MenuIcon from '@mui/icons-material/Menu';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Importé pour les tableaux de bord
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Nouvelle icône pour "Suivre ma commande"
import PaymentIcon from '@mui/icons-material/Payment'; // Nouvelle icône pour "Mes paiements"

// --- Import des composants Material-UI ---
import {
    AppBar,
    Toolbar,
    TextField,
    InputAdornment,
    IconButton,
    Box,
    Container,
    Typography,
    Menu,
    MenuItem,
    CircularProgress,
    Alert
} from "@mui/material";
const SETTINGS_API_URL = process.env.REACT_APP_SETTINGS_API_URL;
const ClientLayout = () => {
    // Récupération des informations utilisateur depuis le contexte
    const { user, logout, isAuthenticated, isAdmin, isSuperAdmin } = useContext(UserContext);
    const navigate = useNavigate(); // Pour la navigation programmatique

    // États locaux pour la gestion du menu et de la recherche
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);
    const [searchQuery, setSearchQuery] = useState("");

    // États pour les paramètres du pied de page
    const [footerSettings, setFooterSettings] = useState(null);
    const [loadingFooter, setLoadingFooter] = useState(true);
    const [errorFooter, setErrorFooter] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // URL de base de l'API

    // Effet pour récupérer les paramètres du pied de page au chargement du composant
    useEffect(() => {
        const fetchFooterSettings = async () => {
            try {
                setLoadingFooter(true);
                setErrorFooter(null);
                // Requête Axios pour récupérer les paramètres du footer (et "À propos")
                const response = await axios.get(`${SETTINGS_API_URL}/app_setings/footer-contact`);
                setFooterSettings(response.data);
            } catch (err) {
                console.error("Échec de la récupération des paramètres du footer :", err);
                setErrorFooter("Échec du chargement des informations du pied de page. Affichage des informations par défaut.");
                // Définition de valeurs par défaut complètes en cas d'erreur
                setFooterSettings({
                    address: "123 Rue de la Gourmandise, Cotonou, Bénin",
                    phone_number: "+229 97 00 00 00",
                    email: "contact@lytefood.com",
                    title: "À propos de Lytefood : Notre Histoire",
                    history_title: "Notre parcours depuis le début",
                    history_content: "Fondée en 2023, Lytefood a commencé avec une vision simple : apporter des repas de qualité supérieure directement à votre porte. De modestes débuts, nous avons grandi pour devenir un service de livraison de référence, en nous engageant toujours envers l'excellence culinaire et la satisfaction de nos clients. Chaque plat est une histoire, chaque livraison une promesse.",
                    restaurant_today_title: "Lytefood aujourd'hui",
                    restaurant_today_content: "Aujourd'hui, Lytefood est plus qu'un simple service de livraison. Nous sommes une communauté de passionnés de cuisine, de chefs talentueux et de livreurs dévoués, tous unis par l'amour de la bonne nourriture. Nous sélectionnons rigoureusement nos partenaires restaurants et mettons tout en œuvre pour vous offrir une expérience culinaire inoubliable, à chaque commande. Notre technologie avancée garantit des livraisons rapides et efficaces.",
                    achievements_title: "Nos réussites et valeurs",
                    achievements_content: "Depuis notre lancement, nous sommes fiers d'avoir servi des milliers de clients satisfaits et d'avoir noué des partenariats solides avec les meilleurs restaurants locaux. Nos valeurs fondamentales sont l'innovation, la qualité, la fiabilité et le service client exceptionnel. Nous nous efforçons constamment d'améliorer nos services et de dépasser vos attentes, en vous proposant toujours plus de choix et de saveurs.",
                });
            } finally {
                setLoadingFooter(false);
            }
        };

        fetchFooterSettings();
    }, [API_BASE_URL]); // Exécuté une seule fois au montage du composant

    // Gestion de l'ouverture et fermeture du menu utilisateur
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    // Gestion de la déconnexion
    const handleLogout = () => {
        logout(); // Appel de la fonction de déconnexion du contexte
        handleMenuClose(); // Fermeture du menu
    };

    // Gestion du changement dans le champ de recherche
    const handleSearchChange = (event) => setSearchQuery(event.target.value);

    // Gestion de la soumission de la recherche (touche Entrée)
    const handleSearchSubmit = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Empêche le comportement par défaut du formulaire
            if (searchQuery.trim()) {
                navigate(`/menus?q=${encodeURIComponent(searchQuery.trim())}`);
            } else {
                navigate("/menus"); // Redirige vers tous les menus si la recherche est vide
            }
            setSearchQuery(''); // Réinitialise la barre de recherche
            handleMenuClose(); // Ferme le menu après la recherche
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* HEADER */}
            <AppBar position="sticky" sx={{ backgroundColor: "#8B4513", boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' }}>
                <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
                    {/* Logo / Titre du site */}
                    <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: "bold",
                                color: "#FFD700",
                                letterSpacing: 1.5,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                            }}
                        >
                            Lytefood
                        </Typography>
                    </Link>

                    {/* Barre de recherche */}
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchSubmit}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
                                </InputAdornment>
                            ),
                            style: {
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '25px',
                                height: '40px',
                                paddingLeft: '10px',
                            },
                        }}
                        sx={{
                            mx: { xs: 1, sm: 2, md: 4 },
                            minWidth: { xs: '120px', sm: '180px', md: '250px' },
                            maxWidth: '300px',
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'transparent' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                            },
                            input: {
                                color: 'white',
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: "rgba(255, 255, 255, 0.7)",
                                opacity: 1,
                            },
                        }}
                    />

                    {/* Icônes de navigation */}
                    <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1.5 }, alignItems: "center" }}>
                        <IconButton component={Link} to="/menus" color="inherit" title="Voir les Menus">
                            <RestaurantMenuIcon />
                        </IconButton>

                        <IconButton component={Link} to="/cart" color="inherit" title="Voir le panier">
                            <ShoppingCartIcon />
                        </IconButton>

                        {/* Menu utilisateur (bouton pour ouvrir) */}
                        <IconButton
                            color="inherit"
                            aria-label="menu utilisateur"
                            aria-controls="user-menu"
                            aria-haspopup="true"
                            onClick={handleMenuOpen}
                            title="Menu utilisateur"
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Contenu du menu utilisateur */}
                        <Menu
                            id="user-menu"
                            anchorEl={anchorEl}
                            open={isMenuOpen}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            sx={{
                                '& .MuiPaper-root': {
                                    backgroundColor: '#8B4513',
                                    boxShadow: '0px 8px 20px rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    mt: 1,
                                },
                            }}
                        >
                            {/* Liens accessibles à tous */}
                            <MenuItem onClick={() => { navigate("/order-history"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                <HistoryIcon sx={{ mr: 1 }} /> Historique
                            </MenuItem>
                            <MenuItem onClick={() => { navigate("/help"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                <HelpOutlineIcon sx={{ mr: 1 }} /> Aide
                            </MenuItem>
                            <MenuItem onClick={() => { navigate("/about"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                <InfoIcon sx={{ mr: 1 }} /> À propos
                            </MenuItem>

                            {/* Liens conditionnels selon l'authentification et les rôles */}
                            {isAuthenticated ? (
                                <>
                                    <MenuItem onClick={() => { navigate("/profile"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                        <AccountCircleIcon sx={{ mr: 1 }} /> Mon Compte
                                    </MenuItem>

                                    {/* NOUVEAU : Suivre ma commande */}
                                    <MenuItem onClick={() => { navigate("/track-order"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                        <LocalShippingIcon sx={{ mr: 1 }} /> Suivre mes commandes
                                    </MenuItem>

                                    {/* NOUVEAU : Mes paiements */}
                                    <MenuItem onClick={() => { navigate("/my-payments"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                        <PaymentIcon sx={{ mr: 1 }} /> Mes paiements
                                    </MenuItem>

                                    {/* Tableau de Bord Livreur */}
                                    {(user?.is_livreur) && (
                                        <MenuItem onClick={() => { navigate("/livreur"); handleMenuClose(); }} sx={{ color: "#00CED1", '&:hover': { backgroundColor: 'rgba(0, 206, 209, 0.1)' } }}>
                                            <DashboardIcon sx={{ mr: 1 }} /> Tableau de Bord Livreur
                                        </MenuItem>
                                    )}

                                    {isAdmin && (
                                        <MenuItem onClick={() => { navigate("/admin"); handleMenuClose(); }} sx={{ color: "#FFD700", '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}>
                                            <DashboardIcon sx={{ mr: 1 }} /> Tableau de Bord Admin
                                        </MenuItem>
                                    )}

                                    {isSuperAdmin && (
                                        <MenuItem onClick={() => { navigate("/super-admin"); handleMenuClose(); }} sx={{ color: "#FFC107", '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.1)' } }}>
                                            <DashboardIcon sx={{ mr: 1 }} /> Tableau de Bord Super Admin
                                        </MenuItem>
                                    )}

                                    <MenuItem onClick={handleLogout} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                        <LogoutIcon sx={{ mr: 1 }} /> Déconnexion
                                    </MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={() => { navigate("/login"); handleMenuClose(); }} sx={{ color: "#fff", '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                    <LoginIcon sx={{ mr: 1 }} /> Connexion
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* MAIN CONTENT */}
            <Box
                component="main"
                sx={{
                    padding: { xs: "1rem", sm: "1.5rem", md: "2rem" },
                    backgroundColor: "#FDF5E6",
                    flexGrow: 1, // Permet au contenu de prendre l'espace restant
                    py: { xs: 3, sm: 4, md: 5 },
                }}
            >
                <Outlet /> {/* Ici sera rendu le contenu de la page spécifique */}
            </Box>

            {/* FOOTER */}
            <Box
                component="footer"
                sx={{
                    backgroundColor: "#3E2723",
                    color: "#fff",
                    padding: { xs: "1rem", sm: "1.5rem" },
                    mt: "auto", // Assure que le footer reste en bas
                    textAlign: "center",
                    borderTop: '4px solid #8B4513',
                }}
            >
                <Container maxWidth="sm">
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#FFD700', mb: 1 }}>
                        Lytefood
                    </Typography>

                    {loadingFooter ? (
                        <CircularProgress color="warning" size={24} sx={{ my: 2 }} />
                    ) : (
                        <Box>
                            {errorFooter && (
                                <Alert severity="warning" sx={{ mb: 2, justifyContent: 'center' }}>
                                    {errorFooter}
                                </Alert>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: { xs: 1, sm: 3 }, mb: 2 }}>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: "rgba(255,255,255,0.8)" }}>
                                    <LocationOnIcon fontSize="small" sx={{ color: '#FFD700' }} />
                                    {footerSettings?.address || "N/A"}
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: "rgba(255,255,255,0.8)" }}>
                                    <PhoneIcon fontSize="small" sx={{ color: '#FFD700' }} />
                                    {footerSettings?.phone_number || "N/A"}
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: "rgba(255,255,255,0.8)" }}>
                                    <EmailIcon fontSize="small" sx={{ color: '#FFD700' }} />
                                    {footerSettings?.email || "N/A"}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                        © {new Date().getFullYear()} Lytefood. Tous droits réservés.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default ClientLayout;