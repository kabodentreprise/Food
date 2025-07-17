import React, { useEffect, useState, useContext } from "react";
import { Container, Typography, List, ListItem, ListItemText, Divider, Box, Chip, CircularProgress, Button } from "@mui/material";
import axios from "axios";
import { UserContext } from '../contexts/UserContext.jsx';
import { useNavigate, Link } from "react-router-dom";

// Utilise l'URL du microservice order depuis le .env
const ORDER_API_URL = process.env.REACT_APP_ORDER_API_URL;

// NOUVEAU : Ajout de 'en_chemin' et harmonisation des noms de clés avec l'énumération DB
const statusColors = {
    "en_attente": "warning", // Correspond à 'en_attente' de la DB
    "payé": "info",          // Harmonisation avec le dashboard admin
    "en_preparation": "primary", // Harmonisation
    "prêt": "warning",       // Harmonisation (peut être la même couleur que 'en_attente' si vous voulez)
    "en_chemin": "secondary",    // NOUVEAU : Couleur pour 'en_chemin'
    "livré": "success",
    "annulée": "error",
    "remboursée": "success" // Ajouté si ce statut peut être affiché à l'utilisateur
};

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, token } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError("Vous devez être connecté pour voir votre historique de commandes.");
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${ORDER_API_URL}/order/my-orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Données brutes des commandes reçues du backend:", res.data);

                // MODIFICATION CLÉ ICI : Afficher UNIQUEMENT les commandes "livré"
                const deliveredOrders = res.data.filter(order => order.status === "livré");
                setOrders(deliveredOrders);

            } catch (err) {
                console.error("Erreur lors de la récupération de l'historique des commandes:", err.response?.data || err.message);
                setOrders([]);
                setError("Impossible de charger votre historique de commandes. Veuillez réessayer.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#E65100' }} />
                <Typography sx={{ mt: 2, color: '#8B4513' }}>Chargement de l'historique des commandes...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
                { !user && (
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={() => navigate("/login")}
                        sx={{ mt: 3, fontWeight: 'bold' }}
                    >
                        Se connecter
                    </Button>
                )}
            </Container>
        );
    }

    // Ajuster le message si aucune commande livrée n'est trouvée
    if (orders.length === 0) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    Aucune commande livrée trouvée dans votre historique pour le moment. 😟
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Commencez à explorer nos <Link to="/menu" style={{ color: '#E65100', textDecoration: 'none', fontWeight: 'bold' }}>délicieux menus</Link> dès maintenant !
                </Typography>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={() => navigate("/menu")}
                    sx={{ mt: 3, fontWeight: 'bold' }}
                >
                    Commander un plat
                </Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 6, mb: 8, backgroundColor: '#FDF5E6', borderRadius: 3, p: { xs: 2, md: 5 }, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)' }}>
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
                Historique de mes Commandes Livrées {/* Titre plus spécifique */}
            </Typography>
            <List>
                {orders.map(order => (
                    <React.Fragment key={order.id}>
                        <ListItem alignItems="flex-start" sx={{
                                bgcolor: '#FFFFFF',
                                borderRadius: 2,
                                mb: 2,
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                                transition: 'box-shadow 0.3s ease',
                                '&:hover': { boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' }
                            }}>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#3E2723" }}>
                                            Commande #{order.id}
                                        </Typography>
                                        <Chip
                                            label={order.status.toUpperCase().replace('_', ' ')}
                                            color={statusColors[order.status] || "default"}
                                            size="medium"
                                            sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                            Total : {order.total} FCFA
                                        </Typography>
                                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                            — Le {new Date(order.created_at).toLocaleString('fr-FR', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Typography>
                                        {order.assigned_livreur_id && (
                                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                — Livreur : {order.livreur_user ? `${order.livreur_user.first_name || ''} ${order.livreur_user.last_name || ''}`.trim() : 'Assigné'}
                                            </Typography>
                                        )}
                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: '#FFF8E1', borderRadius: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                Articles commandés :
                                            </Typography>
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map(item => (
                                                <Typography key={item.id} variant="body2" color="text.primary">
                                                    &bull; {item.menu?.name || `Menu ID: ${item.menu_id}`} x {item.quantity}
                                                </Typography>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    Aucun article trouvé pour cette commande.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                        <Divider component="li" sx={{ my: 2 }} />
                    </React.Fragment>
                ))}
            </List>
        </Container>
    );
};

export default OrderHistoryPage;