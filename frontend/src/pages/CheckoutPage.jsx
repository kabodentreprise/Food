import React, { useState, useEffect, useContext } from "react";
import {
    Container, Typography, Box, Button, Grid, Paper, Divider, Snackbar,
    CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { UserContext } from "../contexts/UserContext.jsx";

const PAIEMENT_API_URL = process.env.REACT_APP_PAIEMENT_API_URL;
const ORDER_API_URL = process.env.REACT_APP_ORDER_API_URL;
const FEDAPAY_PUBLIC_KEY = process.env.REACT_APP_FEDAPAY_PUBLIC_KEY;
const USER_API_URL = process.env.REACT_APP_USER_API_URL;
const TVA_RATE = 0.18;

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CheckoutPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalTVA, setTotalTVA] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [profileEditDialogOpen, setProfileEditDialogOpen] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
    const navigate = useNavigate();
    const { user, token, setUser } = useContext(UserContext);
    const [searchParams] = useSearchParams();
    const orderIdFromQuery = searchParams.get("order_id");

    // Charger le panier ou la commande à payer
    useEffect(() => {
        const loadOrderDetails = async () => {
            setLoading(true);
            try {
                if (orderIdFromQuery) {
                    const res = await axios.get(`${ORDER_API_URL}/order/${orderIdFromQuery}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const orderData = res.data;
                    if (orderData.status !== "en_attente") {
                        showSnackbar(`Cette commande n'est pas en attente de paiement. Statut actuel: ${orderData.status}.`, "warning");
                        setTimeout(() => navigate("/order-history"), 2000);
                        return;
                    }
                    const itemsFromOrder = orderData.items.map(item => ({
                        id: item.menu_id,
                        name: item.menu?.name || `Article ID ${item.menu_id}`,
                        price: parseFloat(item.menu?.price) || 0,
                        quantity: parseInt(item.quantity) || 0,
                    }));
                    let calculatedTotalPrice = 0;
                    let calculatedTotalTVA = 0;
                    itemsFromOrder.forEach(item => {
                        const itemPriceBeforeTVA = item.price * item.quantity;
                        const itemTVA = itemPriceBeforeTVA * TVA_RATE;
                        calculatedTotalPrice += itemPriceBeforeTVA + itemTVA;
                        calculatedTotalTVA += itemTVA;
                    });
                    setCartItems(itemsFromOrder);
                    setTotalPrice(calculatedTotalPrice);
                    setTotalTVA(calculatedTotalTVA);
                } else {
                    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
                    if (storedCart.length === 0) {
                        showSnackbar("Votre panier est vide. Redirection vers les menus.", "warning");
                        setTimeout(() => navigate("/menus"), 2000);
                        return;
                    }
                    let calculatedTotalPrice = 0;
                    let calculatedTotalTVA = 0;
                    storedCart.forEach(item => {
                        const itemPriceBeforeTVA = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                        const itemTVA = itemPriceBeforeTVA * TVA_RATE;
                        calculatedTotalPrice += itemPriceBeforeTVA + itemTVA;
                        calculatedTotalTVA += itemTVA;
                    });
                    setCartItems(storedCart);
                    setTotalPrice(calculatedTotalPrice);
                    setTotalTVA(calculatedTotalTVA);
                }
            } catch (error) {
                setCartItems([]);
                setTotalPrice(0);
                setTotalTVA(0);
                showSnackbar("Erreur lors du chargement des détails de la commande/panier.", "error");
                setTimeout(() => navigate("/menu"), 2000);
            } finally {
                setLoading(false);
            }
        };
        if (token) {
            loadOrderDetails();
        } else {
            setLoading(false);
            showSnackbar("Veuillez vous connecter pour voir les détails de la commande.", "error");
        }
    }, [orderIdFromQuery, navigate, token]);

    // Charger FedaPay Checkout.js si besoin
    useEffect(() => {
        if (!window.FedaPay) {
            const script = document.createElement("script");
            script.src = "https://cdn.fedapay.com/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };
    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleOpenProfileEditDialog = () => {
        setEditFirstName(user?.first_name || '');
        setEditLastName(user?.last_name || '');
        setEditPhoneNumber(user?.phone_number || '');
        setEditDeliveryAddress(user?.delivery_address || '');
        setProfileEditDialogOpen(true);
    };
    const handleCloseProfileEditDialog = () => setProfileEditDialogOpen(false);

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // On ne garde que les champs non vides pour éviter d'envoyer des null/undefined
            const updatedProfile = {};
            if (editFirstName) updatedProfile.first_name = editFirstName;
            if (editLastName) updatedProfile.last_name = editLastName;
            if (editPhoneNumber) updatedProfile.phone_number = editPhoneNumber;
            if (editDeliveryAddress) updatedProfile.delivery_address = editDeliveryAddress;

            // Utiliser l'URL sans slash final
            console.log(token);
            const response = await axios.put(`${process.env.REACT_APP_USER_API_URL}/users/me`, updatedProfile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            showSnackbar("Profil mis à jour avec succès !", "success");
            handleCloseProfileEditDialog();
        } catch (error) {
            showSnackbar("Échec de la mise à jour du profil.", "error");
        } finally {
            setLoading(false);
        }
    };

    const getCartDescription = () => {
        if (!cartItems.length) return "";
        return cartItems.map(item => `${item.name} (x${item.quantity})`).join(", ");
    };

    // Soumission du paiement
    const handlePlaceOrder = async (e) => {
        e && e.preventDefault();
        if (!user || !token) {
            showSnackbar("Veuillez vous connecter pour passer commande.", "error");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }
        if (cartItems.length === 0) {
            showSnackbar("Votre panier est vide. Veuillez ajouter des articles.", "warning");
            setTimeout(() => navigate("/menu"), 2000);
            return;
        }
        if (!FEDAPAY_PUBLIC_KEY) {
            showSnackbar("Clé publique FedaPay non configurée. Contactez l'administrateur.", "error");
            return;
        }
        if (!user.first_name || !user.last_name || !user.phone_number || !user.delivery_address) {
            showSnackbar("Veuillez compléter toutes vos informations de livraison (nom, prénom, téléphone, adresse) avant de confirmer la commande.", "error");
            handleOpenProfileEditDialog();
            return;
        }
        setLoading(true);
        try {
            // Création de la commande côté backend
            const orderResponse = await axios.post(`${ORDER_API_URL}/order/`, {
                items: cartItems.map(item => ({
                    menu_id: item.id,
                    quantity: item.quantity
                })),
                delivery_address: user.delivery_address
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const orderId = orderResponse.data.id;

            // Calcul automatique du montant total à payer (aucune saisie utilisateur)
            const montantPaiement = totalPrice;

            // Préparation config FedaPay
            const config = {
                public_key: FEDAPAY_PUBLIC_KEY,
                transaction: {
                    amount: montantPaiement,
                    description: `Commande #${orderId} - ${user.first_name} ${user.last_name} : ${getCartDescription()}`,
                    currency: { iso: "XOF" },
                    callback_url: `${PAIEMENT_API_URL}/paiement/callback`,
                    customer: {
                        firstname: user.first_name,
                        lastname: user.last_name,
                        email: user.email,
                        phone_number: { number: user.phone_number, country: "bj" }
                    },
                    metadata: {
                        commande_id: orderId,
                        customer_phone: user.phone_number
                    }
                },
                trigger: "manual",
                onComplete: async function (response) {
                    setLoading(false);
                    if (response?.transaction?.status === "approved") {
                        try {
                            await fetch(`${PAIEMENT_API_URL}/paiement/callback`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    transaction_id: String(response.transaction.id),
                                    amount: response.transaction.amount,
                                    status: response.transaction.status,
                                    commande_id: orderId,
                                    customer_phone: user.phone_number
                                })
                            });
                            showSnackbar("Paiement réussi ! Merci pour votre commande.", "success");
                            localStorage.removeItem("cart");
                            setTimeout(() => navigate("/order-history"), 2000);
                        } catch (err) {
                            showSnackbar("Paiement validé mais erreur lors du traitement final.", "error");
                        }
                    } else {
                        showSnackbar("Paiement non validé.", "warning");
                    }
                },
                onClose: function () {
                    setLoading(false);
                }
            };
            if (window.FedaPay) {
                const instance = window.FedaPay.init(config);
                if (Array.isArray(instance)) instance.forEach(el => el.open());
                else instance.open();
            } else {
                showSnackbar("FedaPay non chargé !", "error");
            }
        } catch (err) {
            showSnackbar("Erreur lors de la création de la commande ou du paiement.", "error");
            setLoading(false);
        }
    };

    if (!user || loading) {
        return (
            <Container sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#E65100' }} />
                <Typography sx={{ mt: 2, color: '#8B4513' }}>Chargement des informations...</Typography>
                {!user && (
                    <Typography variant="h5" color="error" sx={{ mb: 2, mt: 4 }}>
                        Vous devez être connecté pour passer commande.
                    </Typography>
                )}
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

    const totalBeforeTVA = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                Finaliser ma Commande
            </Typography>

            {cartItems.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                        Votre panier est vide. 😔
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Découvrez nos délicieux <Link to="/menus" style={{ color: '#E65100', textDecoration: 'none', fontWeight: 'bold' }}>menus</Link> et ajoutez-y des articles !
                    </Typography>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={() => navigate("/menus")}
                        sx={{ mt: 3, fontWeight: 'bold' }}
                    >
                        Aller aux Menus
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={4}>
                    {/* Détails des articles du panier */}
                    <Grid item xs={12} md={7}>
                        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, backgroundColor: '#FFFFFF', mb: 3 }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", borderBottom: '2px solid #FFD700', pb: 1.5, mb: 2.5 }}>
                                Articles de la Commande
                            </Typography>
                            {cartItems.map((item) => {
                                const itemPriceBeforeTVA = item.price * item.quantity;
                                const itemTVAAmount = itemPriceBeforeTVA * TVA_RATE;
                                const itemPriceWithTVA = itemPriceBeforeTVA + itemTVAAmount;
                                return (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1.5, borderBottom: '1px dashed #f0f0f0' }}>
                                        <Typography variant="body1" sx={{ flexGrow: 1, color: "#3E2723" }}>
                                            {item.name} (x{item.quantity})
                                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                ({itemPriceBeforeTVA.toFixed(2)} FCFA HT + {itemTVAAmount.toFixed(2)} FCFA TVA)
                                            </Typography>
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold" sx={{ color: "#E65100" }}>
                                            {itemPriceWithTVA.toFixed(2)} FCFA
                                        </Typography>
                                    </Box>
                                );
                            })}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: "#3E2723" }}>
                                    Sous-total (HT) :
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: "#E65100" }}>
                                    {totalBeforeTVA.toFixed(2)} FCFA
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: "#3E2723" }}>
                                    TVA ({TVA_RATE * 100}%)
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: "#E65100" }}>
                                    {totalTVA.toFixed(2)} FCFA
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '2px solid #FFD700' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: "#8B4513" }}>
                                    Total (TVA incluse) :
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: "#E65100" }}>
                                    {totalPrice.toFixed(2)} FCFA
                                </Typography>
                            </Box>
                        </Paper>

                        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, backgroundColor: '#FFFFFF' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", borderBottom: '2px solid #FFD700', pb: 1.5, mb: 2.5 }}>
                                Informations de Livraison
                            </Typography>
                            {user ? (
                                <Box>
                                    <Typography variant="body1" color="text.secondary">
                                        Email: <Typography component="span" fontWeight="bold">{user.email}</Typography>
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Nom: <Typography component="span" fontWeight="bold">{user.first_name || 'Non spécifié'}</Typography> <Typography component="span" fontWeight="bold">{user.last_name || 'Non spécifié'}</Typography>
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Téléphone: <Typography component="span" fontWeight="bold">{user.phone_number || 'Non spécifié'}</Typography>
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Adresse: <Typography component="span" fontWeight="bold">{user.delivery_address || 'Non spécifiée'}</Typography>
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={handleOpenProfileEditDialog}
                                        sx={{ mt: 2, borderColor: '#FFD700', color: '#E65100' }}
                                    >
                                        Modifier mon profil
                                    </Button>
                                </Box>
                            ) : (
                                <Typography variant="body1" color="error">
                                    Informations utilisateur non disponibles. Veuillez vous connecter.
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Section de paiement */}
                    <Grid item xs={12} md={5}>
                        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, backgroundColor: '#FFFFFF', border: '1px solid #FFD700' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", borderBottom: '2px solid #FFD700', pb: 1.5, mb: 2.5 }}>
                                Paiement
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                En cliquant sur "Confirmer et Payer", une fenêtre sécurisée de paiement FedaPay s'ouvrira.
                            </Typography>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", mb: 2 }}>
                                Total à Payer :
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary" align="center" sx={{ mb: 3, color: "#E65100" }}>
                                {totalPrice.toFixed(2)} FCFA
                            </Typography>
                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                size="large"
                                onClick={handlePlaceOrder}
                                disabled={loading || cartItems.length === 0}
                                sx={{
                                    mt: 2,
                                    borderRadius: 50,
                                    fontWeight: 'bold',
                                    boxShadow: '0px 4px 15px rgba(255, 152, 0, 0.4)',
                                    transition: 'transform 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        backgroundColor: '#e68a00',
                                        boxShadow: '0px 6px 20px rgba(255, 152, 0, 0.6)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Confirmer et Payer"}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Dialogue pour la modification de profil */}
            <Dialog
                open={profileEditDialogOpen}
                onClose={handleCloseProfileEditDialog}
                aria-labelledby="profile-edit-dialog-title"
            >
                <DialogTitle id="profile-edit-dialog-title" sx={{ color: "#8B4513", fontWeight: 'bold' }}>
                    Modifier mes informations de profil
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }} color="text.secondary">
                        Mettez à jour vos informations personnelles et votre adresse de livraison.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="firstName"
                        label="Prénom"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="lastName"
                        label="Nom"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="phoneNumber"
                        label="Numéro de Téléphone"
                        type="tel"
                        fullWidth
                        variant="outlined"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="deliveryAddress"
                        label="Adresse de Livraison"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={editDeliveryAddress}
                        onChange={(e) => setEditDeliveryAddress(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseProfileEditDialog}
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: '#E65100', color: '#E65100' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSaveProfile}
                        color="warning"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            borderRadius: 50,
                            fontWeight: 'bold',
                            boxShadow: '0px 4px 15px rgba(255, 152, 0, 0.4)',
                            transition: 'transform 0.3s ease-in-out',
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Sauvegarder"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CheckoutPage;