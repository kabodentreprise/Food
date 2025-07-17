// D:/FIN/frontend/src/pages/AboutPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, CircularProgress, Alert } from '@mui/material';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import axios from 'axios';

// Utilise l'URL du microservice super_admin pour le contenu "À propos"
const SETTINGS_API_URL = process.env.REACT_APP_SETTINGS_API_URL;

const AboutPage = () => {
    const [aboutContent, setAboutContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAboutContent = async () => {
            try {
                setLoading(true);
                setError(null);
                // MODIFICATION ICI : Appel à l'endpoint /about au lieu de /app-settings
                const response = await axios.get(`${SETTINGS_API_URL}/app_setings/about-content`); // <-- CORRECTION ICI
                setAboutContent(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération du contenu 'À propos' :", err);
                setError("Échec du chargement du contenu de la page 'À propos'. Affichage des informations par défaut.");
                setAboutContent({
                    title: "À propos de Lytefood : Notre Histoire",
                    history_title: "Notre parcours depuis le début",
                    history_content: "Fondée en 2023, Lytefood a commencé avec une vision simple : apporter des repas de qualité supérieure directement à votre porte. De modestes débuts, nous avons grandi pour devenir un service de livraison de référence, en nous engageant toujours envers l'excellence culinaire et la satisfaction de nos clients. Chaque plat est une histoire, chaque livraison une promesse.",
                    restaurant_today_title: "Lytefood aujourd'hui",
                    restaurant_today_content: "Aujourd'hui, Lytefood est plus qu'un simple service de livraison. Nous sommes une communauté de passionnés de cuisine, de chefs talentueux et de livreurs dévoués, tous unis par l'amour de la bonne nourriture. Nous sélectionnons rigoureusement nos partenaires restaurants et mettons tout en œuvre pour vous offrir une expérience culinaire inoubliable, à chaque commande. Notre technologie avancée garantit des livraisons rapides et efficaces.",
                    achievements_title: "Nos réussites et valeurs",
                    achievements_content: "Depuis notre lancement, nous sommes fiers d'avoir servi des milliers de clients satisfaits et d'avoir noué des partenariats solides avec les meilleurs restaurants locaux. Nos valeurs fondamentales sont l'innovation, la qualité, la fiabilité et le service client exceptionnel. Nous nous efforçons constamment d'améliorer nos services et de dépasser vos attentes, en vous proposant toujours plus de choix et de saveurs.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAboutContent();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 6, mb: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} sx={{ color: '#8B4513' }} />
                <Typography variant="h6" sx={{ ml: 2, color: '#8B4513' }}>Chargement de la page "À propos"...</Typography>
            </Container>
        );
    }

    const currentAboutContent = aboutContent || {
        title: "À propos de Lytefood",
        history_title: "Notre Histoire",
        history_content: "Contenu de l'histoire par défaut.",
        restaurant_today_title: "Lytefood Aujourd'hui",
        restaurant_today_content: "Contenu actuel du restaurant par défaut.",
        achievements_title: "Nos Accomplissements",
        achievements_content: "Contenu des accomplissements par défaut."
    };

    return (
        <Container maxWidth="md" sx={{ mt: 6, mb: 8, backgroundColor: '#FDF5E6', borderRadius: 3, p: { xs: 2, md: 5 }, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)' }}>
            {error && (
                <Alert severity="warning" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight="bold"
                align="center"
                sx={{
                    color: "#8B4513",
                    mb: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    pb: 1.5,
                    borderBottom: '5px solid #FFD700',
                    display: 'inline-block',
                    mx: 'auto',
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                }}
            >
                {currentAboutContent.title}
            </Typography>

            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, backgroundColor: '#FFFFFF', mb: 4, border: '1px solid #FFD700' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: "#8B4513" }}>
                    <HistoryEduIcon sx={{ fontSize: 40, mr: 2, color: '#FFD700' }} />
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {currentAboutContent.history_title}
                    </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {currentAboutContent.history_content}
                </Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, backgroundColor: '#FFFFFF', mb: 4, border: '1px solid #FFD700' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: "#8B4513" }}>
                    <StorefrontIcon sx={{ fontSize: 40, mr: 2, color: '#FFD700' }} />
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {currentAboutContent.restaurant_today_title}
                    </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {currentAboutContent.restaurant_today_content}
                </Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, backgroundColor: '#FFFFFF', border: '1px solid #FFD700' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: "#8B4513" }}>
                    <EmojiEventsIcon sx={{ fontSize: 40, mr: 2, color: '#FFD700' }} />
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {currentAboutContent.achievements_title}
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {currentAboutContent.achievements_content}
                </Typography>
            </Paper>
        </Container>
    );
};

export default AboutPage;