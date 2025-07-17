import React, { useState, useEffect, useContext } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    CircularProgress,
    Snackbar,
    Paper,
    Button
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import { UserContext } from '../contexts/UserContext';
import OrderCard from '../components/OrderCard'; // Assurez-vous que OrderCard peut recevoir statusDisplayName
import { useLocation, useNavigate } from 'react-router-dom';

// URL de votre microservice de livreur depuis .env
const LIVREUR_API_URL = process.env.REACT_APP_LIVREUR_API_URL;

// Composant Alert pour le Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const LivreurDashboard = () => {
    const { user, loading: authLoading, token } = useContext(UserContext);

    console.log("--- LivreurDashboard Diagnostics ---");
    console.log("User dans LivreurDashboard:", user);
    console.log("Auth Token dans LivreurDashboard:", token);
    console.log("------------------------------------");

    const [currentAssignedOrders, setCurrentAssignedOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const location = useLocation();
    const navigate = useNavigate();

    const getActiveTabFromUrl = () => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || 'current';
    };
    const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());

    useEffect(() => {
        setActiveTab(getActiveTabFromUrl());
    }, [location.search]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        navigate(`/livreur/dashboard?tab=${tabName}`);
    };

    // Axios instance avec token
    const getAuthAxios = () => {
        return axios.create({
            baseURL: LIVREUR_API_URL,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    };

    // Fonction pour obtenir le nom d'affichage du statut (AJOUTÉE OU MISE À JOUR)
    const getStatusDisplayName = (status) => {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'payé': return 'Payée';
            case 'en_preparation': return 'En préparation (Cuisine)'; // Clarifier que c'est pour la cuisine
            case 'prêt': return 'Prête à livrer';
            case 'en_chemin': return 'En chemin'; // <-- NOUVEAU OU CONFIRMÉ
            case 'livré': return 'Livrée';
            case 'annulée': return 'Annulée';
            case 'remboursée': return 'Remboursée';
            default: return status;
        }
    };

    // Fonction pour récupérer les commandes du livreur (actuelles et historique)
    const fetchOrders = async () => {
        if (authLoading || !user || !user.is_livreur || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const authAxios = getAuthAxios();

            const currentRes = await authAxios.get(`/livreur/orders/my-current`);
            const historyRes = await authAxios.get(`/livreur/orders/history`);

            setCurrentAssignedOrders(currentRes.data);
            setHistoryOrders(historyRes.data);
        } catch (err) {
            console.error("Erreur lors du chargement des commandes :", err.response?.data || err.message);
            setSnackbar({
                open: true,
                message: "Erreur lors du chargement des commandes.",
                severity: "error"
            });
            setCurrentAssignedOrders([]);
            setHistoryOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Rafraîchir les commandes toutes les 30 secondes
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [user, token, authLoading]);

    // Gérer l'action "Prendre en charge"
    const handleTakeOrder = async (orderId) => {
        try {
            const authAxios = getAuthAxios();
            // L'endpoint est `/livreur/orders/{orderId}/take`
            const response = await authAxios.put(`/livreur/orders/${orderId}/take`); 

            if (response.status === 200) {
                // Le message du snackbar doit correspondre au nouveau statut "En chemin"
                setSnackbar({ open: true, message: `Commande #${orderId} : prise en charge et statut mis à jour en "En chemin".`, severity: "success" });
                console.log("DEBUG FRONTEND: Réponse de prise en charge réussie :", response.data);
                fetchOrders(); // Rafraîchir la liste après l'action backend
            }
        } catch (error) {
            console.error("Erreur lors de la prise en charge de la commande :", error.response?.data || error.message);
            setSnackbar({ open: true, message: `Échec de la prise en charge de la commande #${orderId}: ${error.response?.data?.detail || error.message}`, severity: "error" });
        }
    };


    // Gérer l'action "Livré"
    const handleDeliverOrder = async (orderId) => {
        try {
            const authAxios = getAuthAxios();
            const response = await authAxios.put(`/livreur/orders/${orderId}/deliver`);
            if (response.status === 200) {
                setSnackbar({ open: true, message: `Commande #${orderId} marquée comme livrée.`, severity: "success" });
                fetchOrders(); // Rafraîchir la liste après une vraie action backend
            }
        } catch (error) {
            console.error("Erreur lors de la livraison de la commande :", error.response?.data || error.message);
            setSnackbar({ open: true, message: `Échec de la livraison de la commande #${orderId}: ${error.response?.data?.detail || error.message}`, severity: "error" });
            throw error; // Important de propager l'erreur pour le try/catch de OrderCard
        }
    };

    // Gérer l'action "Échec de livraison" (si vous l'ajoutez)
    const handleFailedDelivery = async (orderId) => {
        try {
            const authAxios = getAuthAxios();
            const response = await authAxios.put(`/livreur/orders/${orderId}/failed-delivery`);
            if (response.status === 200) {
                setSnackbar({ open: true, message: `Commande #${orderId} marquée comme "Échec de livraison".`, severity: "info" });
                fetchOrders(); 
            }
        } catch (error) {
            console.error("Erreur lors du marquage de l'échec de livraison :", error.response?.data || error.message);
            setSnackbar({ open: true, message: `Échec du marquage de la commande #${orderId} comme "Échec de livraison": ${error.response?.data?.detail || error.message}`, severity: "error" });
            throw error; 
        }
    };

    const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

    if (authLoading || loading) {
        return (
            <Container sx={{ mt: 8, textAlign: 'center' }}>
                <CircularProgress color="warning" />
                <Typography variant="h6" sx={{ mt: 2 }}>Chargement du tableau de bord livreur...</Typography>
            </Container>
        );
    }

    if (!user || !user.is_livreur) {
        return (
            <Container sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="error">Accès refusé. Vous n'êtes pas un livreur.</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
            <Typography variant="h4" fontWeight="bold" align="center" sx={{ mb: 4, color: "#8B4513" }}>
                Tableau de Bord Livreur {user && `(${user.first_name} ${user.last_name})`}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, borderBottom: '2px solid #ddd' }}>
                <Button
                    variant={activeTab === 'current' ? "contained" : "text"}
                    color="warning"
                    onClick={() => handleTabChange('current')}
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: 0,
                        borderBottom: activeTab === 'current' ? '4px solid #E65100' : 'none',
                        mr: 2
                    }}
                >
                    Commandes Actuelles ({currentAssignedOrders.length})
                </Button>
                <Button
                    variant={activeTab === 'history' ? "contained" : "text"}
                    color="warning"
                    onClick={() => handleTabChange('history')}
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: 0,
                        borderBottom: activeTab === 'history' ? '4px solid #E65100' : 'none'
                    }}
                >
                    Historique Livraisons ({historyOrders.length})
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, backgroundColor: '#FFF8E1' }}>
                {activeTab === 'current' && (
                    <Box>
                        <Typography variant="h5" sx={{ mb: 3, color: "#3E2723" }}>
                            Commandes Assignées Actuelles
                        </Typography>
                        {currentAssignedOrders.length === 0 ? (
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                Aucune commande "prête" ou "en chemin" assignée pour le moment.
                            </Typography>
                        ) : (
                            // Utilisez Grid pour un meilleur affichage des cartes
                            <Grid container spacing={3}>
                                {currentAssignedOrders.map(order => (
                                    <Grid item xs={12} md={6} key={order.id}>
                                        <OrderCard
                                            order={order}
                                            statusDisplayName={getStatusDisplayName(order.status)} // <-- PASS THIS PROP
                                            showActions={true}
                                            onTake={handleTakeOrder}
                                            onDeliver={handleDeliverOrder}
                                            onFailedDelivery={handleFailedDelivery} // Assurez-vous d'avoir cette prop si vous avez le bouton
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}

                {activeTab === 'history' && (
                    <Box>
                        <Typography variant="h5" sx={{ mb: 3, color: "#3E2723" }}>
                            Historique des Livraisons
                        </Typography>
                        {historyOrders.length === 0 ? (
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                Aucune commande livrée ou annulée pour le moment.
                            </Typography>
                        ) : (
                            <Grid container spacing={3}>
                                {historyOrders.map(order => (
                                    <Grid item xs={12} md={6} key={order.id}>
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            statusDisplayName={getStatusDisplayName(order.status)} // <-- PASS THIS PROP
                                            showActions={false} // Pas d'actions pour l'historique
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default LivreurDashboard;