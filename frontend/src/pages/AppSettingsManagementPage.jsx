import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Paper,
    Container,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { UserContext } from "../contexts/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

// Utilise l'URL du microservice super_admin depuis le .env
const SUPER_ADMIN_API_URL = process.env.REACT_APP_SUPER_ADMIN_API_URL;

// Valeurs par défaut pour le footer
const defaultFooterContactSettings = {
    address: "123 Rue de la Gourmandise, Cotonou, Bénin",
    phone_number: "+229 97 00 00 00",
    email: "contact@lytefood.com",
};

// Valeurs par défaut pour la page "À propos"
const defaultAboutSettings = {
    title: "À propos de Lytefood : Notre Histoire",
    history_title: "Notre parcours depuis le début",
    history_content: "Fondée en 2023, Lytefood a commencé avec une vision simple : apporter des repas de qualité supérieure directement à votre porte. De modestes débuts, nous avons grandi pour devenir un service de livraison de référence, en nous engageant toujours envers l'excellence culinaire et la satisfaction de nos clients. Chaque plat est une histoire, chaque livraison une promesse.",
    restaurant_today_title: "Lytefood aujourd'hui",
    restaurant_today_content: "Aujourd'hui, Lytefood est plus qu'un simple service de livraison. Nous sommes une communauté de passionnés de cuisine, de chefs talentueux et de livreurs dévoués, tous unis par l'amour de la bonne nourriture. Nous sélectionnons rigoureusement nos partenaires restaurants et mettons tout en œuvre pour vous offrir une expérience culinaire inoubliable, à chaque commande. Notre technologie avancée garantit des livraisons rapides et efficaces.",
    achievements_title: "Nos réussites et valeurs",
    achievements_content: "Depuis notre lancement, nous sommes fiers d'avoir servi des milliers de clients satisfaits et d'avoir noué des partenariats solides avec les meilleurs restaurants locaux. Nos valeurs fondamentales sont l'innovation, la qualité, la fiabilité et le service client exceptionnel. Nous nous efforçons constamment d'améliorer nos services et de dépasser vos attentes, en vous proposant toujours plus de choix et de saveurs.",
};

const AppSettingsManagementPage = () => {
    const { user, isAuthenticated, isSuperAdmin } = useContext(UserContext);
    const navigate = useNavigate();

    const [footerSettings, setFooterSettings] = useState(defaultFooterContactSettings);
    const [aboutSettings, setAboutSettings] = useState(defaultAboutSettings);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [phoneError, setPhoneError] = useState("");

    useEffect(() => {
        if (!isAuthenticated || !isSuperAdmin) {
            navigate("/login");
            return;
        }
        fetchAppSettings();
        // eslint-disable-next-line
    }, [isAuthenticated, isSuperAdmin, navigate]);

    // Récupère les paramètres du footer et de la page "À propos"
    const fetchAppSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("token");

            const [footerResponse, aboutResponse] = await Promise.all([
                axios.get(`${SUPER_ADMIN_API_URL}/super_admin/footer-contact`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${SUPER_ADMIN_API_URL}/super_admin/about`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setFooterSettings({ ...defaultFooterContactSettings, ...footerResponse.data });
            setAboutSettings({ ...defaultAboutSettings, ...aboutResponse.data });
            setPhoneError("");
        } catch (err) {
            console.error("Erreur lors de la récupération des paramètres :", err);
            setError("Échec du chargement des paramètres. Veuillez réessayer.");
            setSnackbarMessage("Échec du chargement des paramètres.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const validatePhoneNumber = (number) => {
        if (!number) return "";
        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(number)) {
            return "Format invalide. Utilisez chiffres, espaces, tirets, parenthèses et '+' initial.";
        }
        return "";
    };

    const handleChange = (e, section) => {
        const { name, value } = e.target;
        if (section === "footer") {
            setFooterSettings((prev) => ({ ...prev, [name]: value }));
            if (name === "phone_number") {
                setPhoneError(validatePhoneNumber(value));
            }
        } else if (section === "about") {
            setAboutSettings((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Met à jour les paramètres du footer et de la page "À propos"
    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentPhoneError = validatePhoneNumber(footerSettings.phone_number);
        if (currentPhoneError) {
            setPhoneError(currentPhoneError);
            setSnackbarMessage("Veuillez corriger les erreurs dans le formulaire.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Jeton d'authentification non trouvé.");

            await Promise.all([
                axios.put(`${SUPER_ADMIN_API_URL}/super_admin/footer-contact`, footerSettings, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.put(`${SUPER_ADMIN_API_URL}/super_admin/about`, aboutSettings, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setSnackbarMessage("Paramètres de l'application mis à jour avec succès !");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            fetchAppSettings();
        } catch (err) {
            console.error("Erreur lors de la mise à jour des paramètres :", err);
            let errorMessage = "Échec de la mise à jour des paramètres de l'application.";
            if (err.response && err.response.data && err.response.data.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    const phoneErrorDetail = err.response.data.detail.find(
                        (d) => d.loc && d.loc.includes("phone_number")
                    );
                    if (phoneErrorDetail) {
                        errorMessage = `Erreur téléphone: ${phoneErrorDetail.msg}`;
                    } else {
                        errorMessage = err.response.data.detail[0].msg || errorMessage;
                    }
                } else {
                    errorMessage = err.response.data.detail;
                }
            }
            setError(errorMessage);
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSnackbarClose = () => setSnackbarOpen(false);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Chargement des paramètres de l'application...</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#3E2723' }}>
                    Gérer les Paramètres de l'Application (Footer & À propos)
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Section "Paramètres du Footer" */}
                    <Typography variant="h5" sx={{ mb: 2, mt: 3, color: '#8B4513' }}>Informations de Contact (Footer)</Typography>
                    <TextField
                        fullWidth
                        label="Adresse"
                        name="address"
                        value={footerSettings.address}
                        onChange={(e) => handleChange(e, "footer")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Numéro de Téléphone"
                        name="phone_number"
                        value={footerSettings.phone_number}
                        onChange={(e) => handleChange(e, "footer")}
                        margin="normal"
                        variant="outlined"
                        type="tel"
                        inputMode="tel"
                        pattern="^\+?[0-9\s\-\(\)]{7,20}$"
                        error={!!phoneError}
                        helperText={phoneError}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={footerSettings.email}
                        onChange={(e) => handleChange(e, "footer")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 3 }}
                    />

                    {/* Section "Page À propos" */}
                    <Typography variant="h5" sx={{ mb: 2, mt: 4, color: '#8B4513' }}>Contenu de la Page "À propos"</Typography>
                    <TextField
                        fullWidth
                        label="Titre de la page À propos"
                        name="title"
                        value={aboutSettings.title}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Titre de la section Histoire"
                        name="history_title"
                        value={aboutSettings.history_title}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Contenu de la section Histoire"
                        name="history_content"
                        value={aboutSettings.history_content}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        multiline
                        rows={4}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Titre de la section 'Lytefood aujourd'hui'"
                        name="restaurant_today_title"
                        value={aboutSettings.restaurant_today_title}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Contenu de la section 'Lytefood aujourd'hui'"
                        name="restaurant_today_content"
                        value={aboutSettings.restaurant_today_content}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        multiline
                        rows={4}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Titre de la section 'Nos réussites et valeurs'"
                        name="achievements_title"
                        value={aboutSettings.achievements_title}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Contenu de la section 'Nos réussites et valeurs'"
                        name="achievements_content"
                        value={aboutSettings.achievements_content}
                        onChange={(e) => handleChange(e, "about")}
                        margin="normal"
                        variant="outlined"
                        multiline
                        rows={4}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            disabled={submitting || !!phoneError}
                            sx={{
                                bgcolor: '#8B4513',
                                '&:hover': { bgcolor: '#A0522D' },
                                color: '#FFD700',
                                fontWeight: 'bold',
                                py: 1.5,
                                px: 3,
                                borderRadius: '8px',
                            }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Sauvegarder"}
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<RefreshIcon />}
                            onClick={fetchAppSettings}
                            disabled={loading || submitting}
                            sx={{
                                borderColor: '#8B4513',
                                color: '#8B4513',
                                '&:hover': { borderColor: '#A0522D', color: '#A0522D', bgcolor: 'rgba(139, 69, 19, 0.05)' },
                                py: 1.5,
                                px: 3,
                                borderRadius: '8px',
                                fontWeight: 'bold',
                            }}
                        >
                            Actualiser
                        </Button>
                    </Box>
                </form>
            </Paper>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AppSettingsManagementPage;