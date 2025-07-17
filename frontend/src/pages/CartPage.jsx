// src/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Snackbar,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, Link } from "react-router-dom";

// Mise à jour : utilise l'URL du microservice menu pour les images
const STATIC_URL = process.env.REACT_APP_STATIC_URL;

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  // Charger les articles du panier depuis le localStorage au montage du composant
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(storedCart);
    } catch (error) {
      console.error("Erreur lors du chargement du panier depuis le localStorage:", error);
      setCartItems([]);
      showSnackbar("Erreur de chargement du panier.", "error");
    }
  }, []);

  // Fonction utilitaire pour sauvegarder le panier dans le localStorage
  const saveCartToLocalStorage = (updatedCart) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Gérer l'augmentation de la quantité d'un article
  const handleIncreaseQuantity = (itemId) => {
    const updatedCart = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
  };

  // Gérer la diminution de la quantité d'un article
  const handleDecreaseQuantity = (itemId) => {
    const updatedCart = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
    ).filter(item => item.quantity > 0);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
  };

  // Gérer la suppression complète d'un article du panier
  const handleRemoveItem = (itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    showSnackbar("Article supprimé du panier.", "info");
  };

  // Vider complètement le panier
  const handleClearCart = () => {
    setCartItems([]);
    saveCartToLocalStorage([]);
    showSnackbar("Votre panier a été vidé.", "success");
  };

  // Calculer le total du panier
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Gérer la fermeture du Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Fonction utilitaire pour afficher un Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showSnackbar("Votre panier est vide. Veuillez ajouter des articles avant de passer à la caisse.", "warning");
      return;
    }
    navigate("/checkout");
  };

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
        Mon Panier
      </Typography>

      {cartItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Votre panier est vide. 😔
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Découvrez nos délicieux <Link to="/menus" style={{ color: '#E65100', textDecoration: 'none', fontWeight: 'bold' }}>menus</Link> et ajoutez-y des articles !
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {cartItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  display: 'flex',
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#FFFFFF',
                  flexDirection: { xs: 'column', sm: 'row' }
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: { xs: '100%', sm: 150 }, height: { xs: 200, sm: 150 }, objectFit: 'cover', borderRadius: { xs: '3px 3px 0 0', sm: '3px 0 0 3px' } }}
                  image={`${STATIC_URL}${item.image_url}`}
                  alt={item.name}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mb: { xs: 2, sm: 0 }, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#3E2723" }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {item.price} FCFA
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, fontWeight: 'bold', color: '#E65100' }}>
                      Total: {(item.price * item.quantity).toFixed(2)} FCFA
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 2, sm: 0 } }}>
                    <IconButton
                      aria-label="diminuer quantité"
                      onClick={() => handleDecreaseQuantity(item.id)}
                      sx={{ color: '#E65100', '&:hover': { backgroundColor: 'rgba(230, 81, 0, 0.1)' } }}
                    >
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold" sx={{ minWidth: '30px', textAlign: 'center', color: "#8B4513" }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      aria-label="augmenter quantité"
                      onClick={() => handleIncreaseQuantity(item.id)}
                      sx={{ color: '#E65100', '&:hover': { backgroundColor: 'rgba(230, 81, 0, 0.1)' } }}
                    >
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveItem(item.id)}
                    sx={{
                      ml: { sm: 3 },
                      mt: { xs: 2, sm: 0 },
                      borderRadius: 50,
                      fontWeight: 'bold',
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        borderColor: '#d32f2f',
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#FFFFFF',
                border: '1px solid #FFD700',
                position: 'sticky',
                top: 20,
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", borderBottom: '2px solid #FFD700', pb: 1.5, mb: 2.5 }}>
                Résumé de la Commande
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="text.secondary">Total articles :</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#E65100" }}>{calculateTotal()} FCFA</Typography>
              </Box>
              <Button
                variant="contained"
                color="warning"
                fullWidth
                size="large"
                onClick={handleCheckout}
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
                Passer à la caisse
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="large"
                onClick={handleClearCart}
                sx={{
                  mt: 2,
                  borderRadius: 50,
                  fontWeight: 'bold',
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    borderColor: '#d32f2f',
                  },
                }}
              >
                Vider le panier
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CartPage;