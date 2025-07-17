// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Snackbar,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import axios from "axios";
import { styled, keyframes } from '@mui/system';

// Utilisation des URLs des microservices depuis le .env
const MENU_API_URL = process.env.REACT_APP_MENU_API_URL;
const STATIC_URL = process.env.REACT_APP_STATIC_URL;

const backgroundUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const scrollHorizontalText = keyframes`
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
`;

const AnimatedDescription = styled(Typography)(({ $isScrolling, $textWidth }) => ({
  fontSize: '0.95rem',
  lineHeight: 1.6,
  height: '1.6em',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  position: 'relative',
  ...($isScrolling && {
    textOverflow: 'clip',
    animation: `${scrollHorizontalText} ${$textWidth / 30}s linear infinite alternate`,
  }),
}));

const HomePage = () => {
  const [favoriteMenus, setFavoriteMenus] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [expandedMenuIds, setExpandedMenuIds] = useState([]);
  const [descriptionWidths, setDescriptionWidths] = useState({});
  const descriptionRefs = useRef({});

  useEffect(() => {
    // Récupère les menus favoris
    axios
      .get(`${MENU_API_URL}/menu/favoris`)
      .then((res) => {
        const favMenus = res.data.map(menu => ({
          ...menu,
          price: menu.price || 0
        }));
        setFavoriteMenus(favMenus);
      })
      .catch(() => {
        setFavoriteMenus([]);
        setSnackbarMessage("Erreur lors du chargement des plats favoris.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  }, []);

  useEffect(() => {
    const newWidths = {};
    favoriteMenus.forEach(menu => {
      if (descriptionRefs.current[menu.id]) {
        newWidths[menu.id] = descriptionRefs.current[menu.id].scrollWidth;
      }
    });
    setDescriptionWidths(newWidths);
  }, [favoriteMenus]);

  const handleAddToCart = (menu) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((item) => item.id === menu.id);

      let updatedCart;
      if (existing) {
        updatedCart = cart.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...cart, { ...menu, quantity: 1 }];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));

      setSnackbarMessage(`${menu.name} ajouté au panier !`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage("Oups ! Impossible d'ajouter cet article au panier.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleToggleDescription = (menuId) => {
    setExpandedMenuIds((prev) => {
      const isCurrentlyExpanded = prev.includes(menuId);
      if (isCurrentlyExpanded) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#FDF5E6' }}>
      {/* Bannière d'accueil */}
      <Box
        sx={{
          minHeight: { xs: "60vh", md: "70vh" },
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 6,
          color: "#fff",
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
            zIndex: 1,
          }}
        />
        <Box
          sx={{ position: "relative", zIndex: 2, textAlign: "center", p: 2 }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Lytefood Bénin : Votre Faim, Notre Mission !
          </Typography>
          <Typography variant="h5" component="p" sx={{ mb: 4, fontSize: { xs: '1rem', md: '1.5rem' } }}>
            Découvrez une explosion de saveurs. Livraison rapide, fraîcheur garantie.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 50,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0px 4px 15px rgba(255, 152, 0, 0.4)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: '#e68a00',
              },
            }}
            onClick={() => (window.location.href = "/menus")}
          >
            Commander maintenant
          </Button>
        </Box>
      </Box>

      {/* Section des menus favoris */}
      <Box sx={{
        backgroundColor: '#FFF8E1',
        py: 4,
        mb: 6,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.08)',
        borderBottom: '4px solid #FFD700',
      }}>
        <Container>
          <Typography variant="h4" component="h2" fontWeight="bold" sx={{ textAlign: 'center', color: '#ff9800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            <span style={{ borderBottom: '3px solid #ff9800', paddingBottom: '5px' }}>Nos Plats Coup de Cœur !</span>
          </Typography>
        </Container>
      </Box>

      <Container sx={{ mt: 4 }}>
        <Grid container spacing={5} justifyContent="center">
          {favoriteMenus.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mt: 4, py: 5, backgroundColor: '#FEF0DB', borderRadius: 2 }}>
                Oops ! Aucun délice favori à vous présenter pour le moment. Revenez bientôt !
              </Typography>
            </Grid>
          ) : (
            favoriteMenus.map(menu => (
              <Grid item xs={12} sm={6} md={4} key={menu.id}>
                <Card sx={{
                  borderRadius: 3,
                  boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.25)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}>
                  <CardMedia
                    component="img"
                    height="220"
                    image={`${STATIC_URL}${menu.image_url}`}
                    alt={menu.name}
                    sx={{ objectFit: 'cover', borderTopLeftRadius: 3, borderTopRightRadius: 3 }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#8B4513' }}>{menu.name}</Typography>
                      <Box sx={{
                        overflow: 'hidden',
                        mt: 1,
                      }}>
                        <AnimatedDescription
                          ref={el => descriptionRefs.current[menu.id] = el}
                          $isScrolling={expandedMenuIds.includes(menu.id)}
                          $textWidth={descriptionWidths[menu.id] || 0}
                          variant="body2"
                          color="text.secondary"
                        >
                          {menu.description}
                        </AnimatedDescription>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: "bold", color: '#FF9800' }}>
                        {menu.price} FCFA
                      </Typography>
                      <Box sx={{ mt: 2, display: "flex", flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleToggleDescription(menu.id)}
                          sx={{
                            borderRadius: 2,
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#fff3e0',
                              borderColor: '#ff9800',
                            },
                            flexGrow: 1,
                          }}
                        >
                          {expandedMenuIds.includes(menu.id) ? "Moins de détails" : "Plus de détails"}
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 'bold',
                            boxShadow: '0px 2px 8px rgba(255, 152, 0, 0.3)',
                            '&:hover': {
                              boxShadow: '0px 4px 12px rgba(255, 152, 0, 0.5)',
                            },
                            flexGrow: 1,
                          }}
                          startIcon={<ShoppingCartIcon />}
                          onClick={() => handleAddToCart(menu)}
                        >
                          Ajouter
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;