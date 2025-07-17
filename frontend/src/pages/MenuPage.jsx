// src/pages/MenuPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Button,
  Paper,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem as MuiMenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { styled, keyframes } from '@mui/system';

// Utilisation des URLs des microservices depuis le .env
const MENU_API_URL = process.env.REACT_APP_MENU_API_URL;
const CATEGORIE_API_URL = process.env.REACT_APP_CATEGORIE_API_URL;
const STATIC_URL = process.env.REACT_APP_STATIC_URL;

// Composant Alert pour le Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Définition de l'animation de défilement horizontal du texte
const scrollHorizontalText = keyframes`
  0% { transform: translateX(0%); }
  100% { transform: translateX(var(--scroll-offset, 0px)); }
`;

// Composant stylisé pour la description animée
const AnimatedDescription = styled(Typography)(({ theme, isScrolling, textWidth }) => {
  return {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
    display: 'inline-block',
    position: 'absolute',
    left: 0,
    top: 0,
    width: 'auto',
    maxWidth: `${textWidth}px`,
    textOverflow: isScrolling ? 'clip' : 'ellipsis',
    overflow: 'hidden',
    transition: 'transform 0.3s ease-out, text-overflow 0.3s ease-out',
    ...(isScrolling && {
      animation: `${scrollHorizontalText} var(--animation-duration) linear infinite alternate`,
    }),
  };
});

// Composant pour afficher un seul menu (réutilisable)
const MenuItemCard = ({
  menu,
  handleToggleDescription,
  animatedMenuIds,
  handleAddToCart,
  STATIC_URL,
  descriptionData,
  descriptionTextRef,
  descriptionContainerRef,
}) => {
  const needsScroll = descriptionData[menu.id]?.needsScroll || false;
  const isCurrentlyAnimated = animatedMenuIds.includes(menu.id);
  const textWidth = descriptionData[menu.id]?.scrollWidth || 0;
  const containerClientWidth = descriptionData[menu.id]?.clientWidth || 0;
  const applyScrollingAnimation = isCurrentlyAnimated && needsScroll;

  return (
    <Card
      key={menu.id}
      sx={{
        minWidth: { xs: '280px', sm: '320px', md: '350px' },
        flexShrink: 0,
        borderRadius: 3,
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-12px)',
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.3)',
        },
        backgroundColor: '#FFFFFF',
        scrollSnapAlign: 'start',
      }}
    >
      <CardMedia
        component="img"
        height="220"
        image={`${STATIC_URL}${menu.image_url}`}
        alt={menu.name}
        sx={{ objectFit: 'cover', borderTopLeftRadius: 3, borderTopRightRadius: 3 }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
        <Box>
          <Typography
            variant="h6"
            component="h3"
            fontWeight="bold"
            sx={{ color: "#3E2723", lineHeight: 1.3, mb: 1.5 }}
          >
            {menu.name}
          </Typography>
          <Box
            ref={el => descriptionContainerRef.current[menu.id] = el}
            sx={{
              height: '1.6em',
              overflow: 'hidden',
              position: 'relative',
              mb: 1.5,
              width: '100%',
              '--scroll-offset': applyScrollingAnimation
                ? `${-(textWidth - containerClientWidth)}px`
                : '0px',
              '--animation-duration': applyScrollingAnimation
                ? `${Math.max(3, Math.abs(textWidth - containerClientWidth) / 20)}s`
                : '0s',
            }}
          >
            <AnimatedDescription
              ref={el => descriptionTextRef.current[menu.id] = el}
              isScrolling={applyScrollingAnimation}
              textWidth={textWidth}
              variant="body2"
              color="text.secondary"
            >
              {menu.description}
            </AnimatedDescription>
          </Box>
        </Box>
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="h5"
            component="p"
            fontWeight="bold"
            sx={{ color: '#E65100', textAlign: 'right', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}
          >
            {menu.price} FCFA
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => handleToggleDescription(menu.id)}
              sx={{
                borderRadius: 50,
                borderColor: '#ff9800',
                color: '#ff9800',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  borderColor: '#ff9800',
                },
                flexShrink: 0,
                minWidth: '130px',
              }}
            >
              {isCurrentlyAnimated ? "Voir moins" : "Voir plus"}
            </Button>
            <Button
              variant="contained"
              size="medium"
              color="warning"
              startIcon={<ShoppingCartIcon />}
              onClick={() => handleAddToCart(menu)}
              sx={{
                borderRadius: 50,
                fontWeight: 'bold',
                boxShadow: '0px 6px 15px rgba(255, 152, 0, 0.5)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0px 8px 20px rgba(255, 152, 0, 0.7)',
                  backgroundColor: '#e68a00',
                },
                flexGrow: 1,
                px: 3,
              }}
            >
              Ajouter
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const MenuPage = () => {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [animatedMenuIds, setAnimatedMenuIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Recherche et filtre
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const navigate = useNavigate();

  // Références pour la mesure des descriptions
  const descriptionTextRefs = useRef({});
  const descriptionContainerRefs = useRef({});
  const [descriptionData, setDescriptionData] = useState({});

  // Récupère tous les menus et catégories
  const fetchMenusAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const menusRes = await axios.get(`${MENU_API_URL}/menu/`);
      setMenus(menusRes.data);

      const categoriesRes = await axios.get(`${MENU_API_URL}/menu/categories`);
      setCategories(categoriesRes.data);

    } catch (err) {
      setError("Impossible de charger les menus ou catégories.");
      setSnackbarMessage("Erreur de chargement de la carte. Veuillez réessayer plus tard.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setMenus([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenusAndCategories();
  }, []);

  // Mesure des largeurs de description pour l'animation
  useEffect(() => {
    const newDescriptionData = {};
    let shouldUpdate = false;
    menus.forEach(menu => {
      const textElement = descriptionTextRefs.current[menu.id];
      const containerElement = descriptionContainerRefs.current[menu.id];
      if (textElement && containerElement) {
        const currentScrollWidth = textElement.scrollWidth;
        const currentClientWidth = containerElement.clientWidth;
        const needsScroll = currentScrollWidth > currentClientWidth + 1;
        if (!descriptionData[menu.id] ||
            descriptionData[menu.id].scrollWidth !== currentScrollWidth ||
            descriptionData[menu.id].clientWidth !== currentClientWidth ||
            descriptionData[menu.id].needsScroll !== needsScroll) {
          newDescriptionData[menu.id] = {
            scrollWidth: currentScrollWidth,
            clientWidth: currentClientWidth,
            needsScroll: needsScroll
          };
          shouldUpdate = true;
        } else {
          newDescriptionData[menu.id] = descriptionData[menu.id];
        }
      } else {
        if (descriptionData[menu.id]?.scrollWidth !== 0 || descriptionData[menu.id]?.clientWidth !== 0) {
            newDescriptionData[menu.id] = { scrollWidth: 0, clientWidth: 0, needsScroll: false };
            shouldUpdate = true;
        } else if (!descriptionData[menu.id]) {
            newDescriptionData[menu.id] = { scrollWidth: 0, clientWidth: 0, needsScroll: false };
        }
      }
    });
    if (shouldUpdate) {
      setDescriptionData(newDescriptionData);
    }
  }, [menus, descriptionData]);

  // Recherche et filtre par catégorie
  const filteredMenus = menus.filter(menu => {
    const matchesSearch =
      search.trim() === "" ||
      menu.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (menu.description && menu.description.toLowerCase().includes(search.trim().toLowerCase()));
    const matchesCategory =
      !selectedCategory || menu.category_id === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const categoriesToShow = categories.filter(category =>
    filteredMenus.some(menu => menu.category_id === category.id)
  );

  const handleToggleDescription = (menuId) => {
    setAnimatedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleAddToCart = (menu) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = cart.find((item) => item.id === menu.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...menu, quantity: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));

      setSnackbarMessage(`${menu.name} a été ajouté à votre panier !`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Oups ! Impossible d'ajouter cet article au panier.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Gestion du submit du champ recherche (pour permettre la touche Entrée)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
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
        Notre Carte Exquise
      </Typography>

      {/* Barre de recherche et filtre catégorie */}
      <Box
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextField
          placeholder="Rechercher un menu ou une description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#E65100' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 350 },
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0px 2px 8px rgba(255, 215, 0, 0.08)',
          }}
        />
        <FormControl
          sx={{
            minWidth: 200,
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0px 2px 8px rgba(255, 215, 0, 0.08)',
          }}
        >
          <InputLabel id="category-filter-label">Catégorie</InputLabel>
          <Select
            labelId="category-filter-label"
            value={selectedCategory}
            label="Catégorie"
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <MuiMenuItem value="">Toutes les catégories</MuiMenuItem>
            {categories.map(cat => (
              <MuiMenuItem key={cat.id} value={cat.id}>{cat.name}</MuiMenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column' }}>
          <CircularProgress size={60} sx={{ color: '#E65100' }} />
          <Typography variant="h6" sx={{ mt: 3, color: '#8B4513' }}>
            Préparation de nos meilleurs plats...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>
            Problème de connexion !
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={fetchMenusAndCategories}
            sx={{ mt: 3, fontWeight: 'bold' }}
          >
            Réessayer
          </Button>
        </Box>
      ) : (
        <>
          {categoriesToShow.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Aucun menu trouvé pour votre recherche ou filtre. 😔
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Essayez un autre mot-clé ou filtre, ou <Link to="/menu" style={{ color: '#E65100', textDecoration: 'none', fontWeight: 'bold' }}>explorez tous nos menus</Link>.
              </Typography>
            </Box>
          )}
          {categoriesToShow.map((category) => {
            const menusInCategory = filteredMenus.filter((menu) => menu.category_id === category.id);
            if (menusInCategory.length === 0) return null;
            return (
              <Box key={category.id} sx={{ mt: 8 }}>
                <Paper elevation={6} sx={{ bgcolor: "#FFD700", py: 2.5, mb: 5, borderRadius: 3, boxShadow: '0px 10px 25px rgba(255, 215, 0, 0.5)' }}>
                  <Typography
                    variant="h4"
                    align="center"
                    color="#8B4513"
                    fontWeight="bold"
                    sx={{ letterSpacing: 2, textTransform: 'uppercase', px: 2, fontSize: { xs: '1.5rem', sm: '2rem' } }}
                  >
                    ✨ {category.name} ✨
                  </Typography>
                </Paper>
                <Box
                  sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: 4,
                    pb: 2,
                    '&::-webkit-scrollbar': { height: '0px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'transparent' },
                    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                    scrollbarWidth: 'none',
                    scrollSnapType: 'x mandatory',
                    scrollPaddingLeft: '16px',
                  }}
                >
                  {menusInCategory.map((menu) => (
                    <MenuItemCard
                      key={menu.id}
                      menu={menu}
                      handleToggleDescription={handleToggleDescription}
                      animatedMenuIds={animatedMenuIds}
                      handleAddToCart={handleAddToCart}
                      STATIC_URL={STATIC_URL}
                      descriptionData={descriptionData}
                      descriptionTextRef={descriptionTextRefs}
                      descriptionContainerRef={descriptionContainerRefs}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MenuPage;