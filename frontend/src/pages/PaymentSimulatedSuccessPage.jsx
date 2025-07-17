// src/pages/PaymentSimulatedSuccessPage.jsx
import React, { useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

// URL de votre microservice de paiement (doit être définie dans .env ou similaire)
const PAIEMENT_API_URL = process.env.REACT_APP_PAIEMENT_API_URL;
const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL; // Pour get_current_user

const PaymentSimulatedSuccessPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get('order_id');

    useEffect(() => {
        // Optionnel : Marquer la commande comme "payée" dans votre backend
        // Ceci est une simulation complète si FedaPay ne valide pas.
        // Cette partie dépend de votre endpoint /paiement/confirm
        const confirmSimulatedPayment = async () => {
            if (orderId) {
                try {
                    const token = localStorage.getItem("token");
                    await axios.post(
                        PAIEMENT_API_URL + "/confirm",
                        {
                            order_id: parseInt(orderId),
                            fedapay_transaction_id: `SIMULATED_FEDAPAY_${Date.now()}` // ID simulé
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    console.log("Commande marquée comme payée (simulé) :", orderId);
                } catch (error) {
                    console.error("Erreur lors de la confirmation simulée du paiement:", error);
                    // Gérer l'erreur si la confirmation simulée échoue
                }
            }
        };

        confirmSimulatedPayment();
    }, [orderId]);


    return (
        <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
            <Box sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'green', fontWeight: 'bold' }}>
                    Paiement Simulé Réussi !
                </Typography>
                <Typography variant="body1" paragraph>
                    Votre commande #{orderId} a été traitée avec succès dans notre système de démonstration.
                </Typography>
                <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
                    Veuillez noter que ce paiement est une simulation pour la démonstration du flux complet.
                </Typography>
                <Button
                    component={Link}
                    to="/mes-commandes" // Adaptez ce chemin vers votre page de l'historique des commandes
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                >
                    Voir mes commandes
                </Button>
                <Button
                    component={Link}
                    to="/" // Page d'accueil
                    variant="outlined"
                    sx={{ mt: 3, ml: 2 }}
                >
                    Retour à l'accueil
                </Button>
            </Box>
        </Container>
    );
};

export default PaymentSimulatedSuccessPage;