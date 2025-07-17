// src/pages/MenuManagement.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import {
  Container, Typography, TextField, Button, Box, Select, MenuItem,
  InputLabel, FormControl, Paper, List, ListItem, ListItemText,
  IconButton, FormHelperText, Divider, Stack,
  CircularProgress,
  Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit"; // <-- Correction ici !
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import { UserContext } from '../contexts/UserContext.jsx';
import { styled, keyframes } from '@mui/system';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const MENU_API_URL = process.env.REACT_APP_MENU_API_URL;
const CATEGORY_API_URL = process.env.REACT_APP_CATEGORY_API_URL;
const STATIC_URL = process.env.REACT_APP_STATIC_URL;

// Définition de l'animation de défilement horizontal du texte
const scrollHorizontalText = keyframes`
  0% { transform: translateX(0%); }
  100% { transform: translateX(var(--scroll-offset, 0px)); } /* Décalage dynamique via CSS variable */
`;

// Composant stylisé pour la description animée
const AnimatedDescription = styled(Typography)(({ theme, isScrolling, textWidth }) => {
  return {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    whiteSpace: 'nowrap', // Force le texte sur une seule ligne
    display: 'inline-block', // Permet de mesurer scrollWidth correctement et de se positionner
    position: 'absolute', // Positionnement absolu pour ne pas affecter la hauteur du parent
    left: 0,
    top: 0,
    width: `${textWidth}px`, // L'élément prend la largeur réelle de son contenu
    textOverflow: isScrolling ? 'clip' : 'ellipsis', // Tronque par ellipsis ou coupe si animé
    transition: 'transform 0.3s ease-out, text-overflow 0.3s ease-out', // Transitions douces

    ...(isScrolling && {
      animation: `${scrollHorizontalText} var(--animation-duration) linear infinite alternate`, // Utilise les variables CSS pour la durée
    }),
  };
});

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [editingMenu, setEditingMenu] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);

  const { token } = useContext(UserContext);
  const formRef = useRef(null);

  // ÉTATS POUR LA DESCRIPTION ANIMÉE
  const [animatedMenuIds, setAnimatedMenuIds] = useState([]);
  const [descriptionData, setDescriptionData] = useState({});

  // RÉFÉRENCES POUR LA MESURE DES ÉLÉMENTS
  const descriptionTextRefs = useRef({});
  const descriptionContainerRefs = useRef({});

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchMenusAndCategories = async () => {
    setLoading(true);
    try {
      const menusRes = await axios.get(`${MENU_API_URL}/menu/`);
      setMenus(menusRes.data);
      const categoriesRes = await axios.get(`${MENU_API_URL}/menu/categories`);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des menus ou catégories:", error.response?.data || error.message);
      setMenus([]);
      setCategories([]);
      showSnackbar("Impossible de charger les menus ou les catégories.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMenusAndCategories();
    } else {
      setLoading(false);
      showSnackbar("Veuillez vous connecter pour gérer les menus.", "info");
    }
  }, [token]);

  // useEffect POUR LA MESURE DES LARGEURS - Optimisation et déclenchement
  // S'assure que les mesures sont prises APRES que les menus aient été rendus
  // en utilisant une dépendance à 'menus' et en s'assurant que les refs sont définies.
  useEffect(() => {
    const newDescriptionData = {};
    let shouldUpdate = false; // Flag pour éviter les mises à jour inutiles de l'état

    menus.forEach(menu => {
      const textElement = descriptionTextRefs.current[menu.id];
      const containerElement = descriptionContainerRefs.current[menu.id];

      if (textElement && containerElement) {
        const currentScrollWidth = textElement.scrollWidth;
        const currentClientWidth = containerElement.clientWidth;
        const needsScroll = currentScrollWidth > currentClientWidth;

        // Met à jour seulement si les valeurs ont changé ou si c'est la première fois
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
          newDescriptionData[menu.id] = descriptionData[menu.id]; // Garde l'ancienne valeur si pas de changement
        }
      } else {
        // Initialise ou réinitialise si les refs ne sont pas encore prêtes
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
  }, [menus, descriptionData]); // Ajout de descriptionData comme dépendance pour s'assurer des mises à jour incrémentales

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError("");
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      if (editingMenu && editingMenu.image_url) {
        setCurrentImageUrl(editingMenu.image_url);
      } else {
        setCurrentImageUrl("");
      }
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setImageError("Format d'image invalide (JPEG, PNG, GIF, WEBP seulement)");
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image trop lourde (max 5MB)");
      setImageFile(null);
      setImagePreview("");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setEditingMenu(null);
    setName("");
    setPrice("");
    setDescription("");
    setCategoryId("");
    setImageFile(null);
    setImagePreview("");
    setCurrentImageUrl("");
    setImageError("");
    setAnimatedMenuIds([]); // Réinitialise l'état d'animation
  };

  const handleAddOrUpdateMenu = async (e) => {
    e.preventDefault();
    setSnackbarOpen(false);
    setImageError("");
    if (!token) {
      showSnackbar("Vous devez être connecté pour gérer les menus.", "error");
      return;
    }
    if (!name.trim() || !price || !description.trim() || !category_id) {
      showSnackbar("Veuillez remplir tous les champs obligatoires (Nom, Prix, Description, Catégorie).", "warning");
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      showSnackbar("Le prix doit être un nombre positif.", "warning");
      return;
    }
    if (!editingMenu && !imageFile) {
      setImageError("Une image est requise pour ajouter un nouveau menu.");
      showSnackbar("Une image est requise pour ajouter un nouveau menu.", "warning");
      return;
    }
    if (editingMenu && !imageFile && !currentImageUrl) {
      setImageError("Veuillez choisir une image ou annuler l'édition si vous ne souhaitez pas en ajouter.");
      showSnackbar("Veuillez choisir une image ou annuler l'édition si vous ne souhaitez pas en ajouter.", "warning");
      return;
    }
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("price", parseFloat(price));
    formData.append("description", description.trim());
    formData.append("category_id", parseInt(category_id));
    if (imageFile) formData.append("image", imageFile);
    try {
      if (editingMenu) {
        await axios.put(`${MENU_API_URL}/menu/${editingMenu.id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        showSnackbar(`Menu "${name}" mis à jour avec succès !`, "success");
      } else {
        await axios.post(`${MENU_API_URL}/menu/`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        showSnackbar(`Menu "${name}" ajouté avec succès !`, "success");
      }
      resetForm();
      fetchMenusAndCategories();
    } catch (err) {
      console.error("Erreur lors de l'envoi du menu:", err.response?.data || err.message);
      showSnackbar(`Erreur lors de l'envoi du menu: ${err.response?.data?.detail || err.message}`, "error");
    }
  };

  const handleEditClick = (menu) => {
    setEditingMenu(menu);
    setName(menu.name);
    setPrice(menu.price.toString());
    setDescription(menu.description || "");
    setCategoryId(menu.category_id.toString());
    setCurrentImageUrl(menu.image_url || "");
    setImageFile(null);
    setImagePreview("");
    setAnimatedMenuIds([]); // Réinitialise l'état d'animation lors de l'édition
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const confirmDelete = (menu) => {
    setMenuToDelete(menu);
    setDialogOpen(true);
  };

  const handleDeleteMenu = async () => {
    setDialogOpen(false);
    setSnackbarOpen(false);
    if (!menuToDelete) return;
    if (!token) {
      showSnackbar("Vous devez être connecté pour supprimer un menu.", "error");
      return;
    }
    try {
      await axios.delete(`${MENU_API_URL}/menu/${menuToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar(`Menu "${menuToDelete.name}" supprimé avec succès !`, "success");
      fetchMenusAndCategories();
    } catch (error) {
      console.error("Erreur lors de la suppression du menu:", error.response?.data || error.message);
      showSnackbar(`Erreur lors de la suppression du menu: ${error.response?.data?.detail || error.message}`, "error");
    } finally {
      setMenuToDelete(null);
    }
  };

  const handleToggleFavorite = async (menuId, currentIsFavorite, menuName) => {
    setSnackbarOpen(false);
    if (!token) {
      showSnackbar("Vous devez être connecté en tant qu'administrateur pour modifier le statut favori.", "error");
      return;
    }
    try {
      setMenus(prevMenus => prevMenus.map(menu =>
        menu.id === menuId ? { ...menu, is_favorite: !currentIsFavorite } : menu
      ));
      await axios.post(`${MENU_API_URL}/menu/${menuId}/favoris`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar(`Le menu "${menuName}" est maintenant ${currentIsFavorite ? 'retiré des' : 'ajouté aux'} favoris !`, "info");
    } catch (error) {
      console.error("Erreur lors du changement de favori:", error.response?.data || error.message);
      showSnackbar(`Erreur lors de la modification du statut favori pour "${menuName}".`, "error");
      setMenus(prevMenus => prevMenus.map(menu =>
        menu.id === menuId ? { ...menu, is_favorite: currentIsFavorite } : menu
      ));
    }
  };

  // handleToggleAnimation
  const handleToggleAnimation = (menuId) => {
    setAnimatedMenuIds((prev) => {
      const isCurrentlyAnimated = prev.includes(menuId);
      if (isCurrentlyAnimated) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: '#8B4513', mb: 4 }}>
        Gestion des Menus
      </Typography>

      <Paper
        elevation={4}
        sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)', mb: 4 }}
        ref={formRef}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", color: '#E65100' }}>
          {editingMenu ? "Modifier le menu" : "Ajouter un nouveau menu"}
        </Typography>

        <form onSubmit={handleAddOrUpdateMenu}>
          <Stack spacing={3}>
            <TextField
              label="Nom du menu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#FFD700' }, '&:hover fieldset': { borderColor: '#FFC107' }, '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' } } }}
            />
            <TextField
              label="Prix (FCFA)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
              required
              type="number"
              inputProps={{ min: "0", step: "0.01" }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#FFD700' }, '&:hover fieldset': { borderColor: '#FFC107' }, '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' } } }}
            />
            <TextField
              label="Description du menu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3} // On peut laisser 3 lignes ici pour l'édition, mais la carte affichera 1 ligne animée
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#FFD700' }, '&:hover fieldset': { borderColor: '#FFC107' }, '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' } } }}
            />
            <FormControl fullWidth required variant="outlined" sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#FFD700' }, '&:hover fieldset': { borderColor: '#FFC107' }, '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' } } }}>
              <InputLabel>Catégorie</InputLabel>
              <Select value={category_id} label="Catégorie" onChange={(e) => setCategoryId(e.target.value)}>
                {categories.length === 0 ? (
                  <MenuItem disabled>Aucune catégorie disponible. Veuillez en ajouter une via la section Catégories.</MenuItem>
                ) : (
                  categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth error={!!imageError}>
              <input accept="image/*" type="file" id="image-upload" style={{ display: "none" }} onChange={handleImageChange} />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{
                    borderColor: '#FFD700', color: '#8B4513',
                    '&:hover': { borderColor: '#E65100', backgroundColor: 'rgba(255, 152, 0, 0.05)' }
                  }}
                >
                  {imageFile || currentImageUrl ? "Changer l'image" : "Choisir une image"}
                </Button>
              </label>
              {imageError && <FormHelperText error>{imageError}</FormHelperText>}

              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {imagePreview && (
                  <img src={imagePreview} alt="Nouvelle prévisualisation" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #FFD700' }} />
                )}
                {editingMenu && currentImageUrl && !imagePreview && (
                  <img src={`${STATIC_URL}${currentImageUrl}`} alt="Image actuelle" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />
                )}
                {editingMenu && currentImageUrl && imagePreview && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Actuelle</Typography>
                    <img src={`${STATIC_URL}${currentImageUrl}`} alt="Image actuelle" style={{ maxWidth: 80, maxHeight: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />
                  </Box>
                )}
              </Box>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
              {editingMenu && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={resetForm}
                  startIcon={<CancelIcon />}
                  sx={{ '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.05)' } }}
                >
                  Annuler l'édition
                </Button>
              )}
              <Button
                variant="contained"
                color="warning"
                type="submit"
                startIcon={editingMenu ? <SaveIcon /> : <AddCircleOutlineIcon />}
                sx={{
                  fontWeight: 'bold',
                  boxShadow: '0px 4px 15px rgba(255, 152, 0, 0.4)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.01)',
                    backgroundColor: '#e68a00',
                    boxShadow: '0px 6px 20px rgba(255, 152, 0, 0.6)',
                  },
                }}
              >
                {editingMenu ? "Sauvegarder les modifications" : "Ajouter le menu"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      <Divider sx={{ my: 6, borderColor: '#FFD700', borderBottomWidth: 2 }} />

      <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: '#E65100', mb: 3 }}>
          Menus du restaurant
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress color="warning" />
            <Typography variant="h6" sx={{ ml: 2, color: '#8B4513' }}>Chargement des menus...</Typography>
          </Box>
        ) : categories.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucune catégorie n'est définie. Veuillez en ajouter une via la section Catégories.
          </Alert>
        ) : menus.length === 0 ? (
          <Alert severity="info">
            Aucun menu disponible pour le moment. Utilisez le formulaire ci-dessus pour en ajouter un.
          </Alert>
        ) : (
          categories.map((category) => {
            const menusOfCategory = menus.filter((menu) => menu.category_id === category.id);
            return (
              <Box key={category.id} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1.5, color: "#8B4513", fontWeight: "bold", borderBottom: '1px solid #FFD700', pb: 0.5 }}>
                  🍽️ {category.name}
                </Typography>
                {menusOfCategory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 2 }}>
                    Aucun menu dans cette catégorie.
                  </Typography>
                ) : (
                  <List>
                    {menusOfCategory.map((menu) => (
                      <React.Fragment key={menu.id}>
                        <ListItem
                          sx={{
                            // Fix pour la hauteur de la carte: Utiliser une hauteur fixe
                            // C'était la cause principale de l'élargissement.
                            height: '120px', // Hauteur fixe de la carte. Ajustez si besoin.
                            overflow: 'hidden', // Cache tout ce qui dépasse si la carte est fixe
                            alignItems: 'flex-start', // Garde les éléments en haut si la carte est plus grande que le contenu
                            py: 1.5,
                            '&:hover': { bgcolor: '#FFFDE7' },
                            borderRadius: 1,
                            bgcolor: editingMenu?.id === menu.id ? '#FFFAE0' : 'inherit',
                          }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <IconButton
                                onClick={() => handleToggleFavorite(menu.id, menu.is_favorite, menu.name)}
                                size="small"
                                sx={{ color: menu.is_favorite ? '#FFD700' : 'text.disabled', '&:hover': { color: '#E65100' } }}
                              >
                                {menu.is_favorite ? <StarIcon /> : <StarBorderIcon />}
                              </IconButton>
                              <IconButton
                                onClick={() => handleEditClick(menu)}
                                size="small"
                                sx={{ color: '#1976D2', '&:hover': { color: '#0D47A1' } }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => confirmDelete(menu)}
                                size="small"
                                sx={{ color: '#D32F2F', '&:hover': { color: '#B71C1C' } }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          {menu.image_url && (
                            <Box
                              component="img"
                              src={`${STATIC_URL}${menu.image_url}`}
                              alt={menu.name}
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                mr: 2,
                                border: '1px solid #eee',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <ListItemText
                            primary={
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3E2723' }}>
                                {menu.name} - <Box component="span" sx={{ color: '#E65100' }}>{menu.price} FCFA</Box>
                              </Typography>
                            }
                            secondary={
                              <>
                                {/* Conteneur de la description */}
                                <Box
                                  ref={el => descriptionContainerRefs.current[menu.id] = el}
                                  sx={{
                                    height: '1.6em', // HAUTEUR FIXE ABSOLUE POUR LA DESCRIPTION
                                    overflow: 'hidden', // Cache ce qui dépasse
                                    position: 'relative', // Nécessaire pour le positionnement absolu de l'enfant
                                    mt: 1,
                                    width: '100%',
                                    // Variables CSS pour l'animation, calculées dans l'useEffect
                                    '--scroll-offset': `${-(descriptionData[menu.id]?.scrollWidth - descriptionData[menu.id]?.clientWidth)}px`,
                                    // La durée doit être au moins 1s pour éviter des divisions par zéro si la différence est 0
                                    '--animation-duration': `${Math.max(1, Math.abs((descriptionData[menu.id]?.scrollWidth || 0) - (descriptionData[menu.id]?.clientWidth || 0)) / 20)}s`, // Vitesse 20px/sec
                                  }}
                                >
                                  {/* La description animée elle-même */}
                                  <AnimatedDescription
                                    ref={el => descriptionTextRefs.current[menu.id] = el}
                                    isScrolling={animatedMenuIds.includes(menu.id)}
                                    textWidth={descriptionData[menu.id]?.scrollWidth || 0}
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {menu.description}
                                  </AnimatedDescription>
                                </Box>

                                {/* Bouton "Plus de détails" */}
                                {descriptionData[menu.id]?.needsScroll && (
                                  <Button
                                    onClick={() => handleToggleAnimation(menu.id)}
                                    size="small"
                                    sx={{
                                      mt: 0.5,
                                      color: '#E65100',
                                      textTransform: 'none',
                                      padding: '0 4px',
                                      minWidth: 'auto',
                                      alignSelf: 'flex-start',
                                    }}
                                  >
                                    {animatedMenuIds.includes(menu.id) ? "Moins de détails" : "Plus de détails"}
                                  </Button>
                                )}
                              </>
                            }
                            sx={{
                              mr: 2,
                              flexGrow: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              // Ajoutez un overflow: hidden ici si le texte du titre ou autre déborde
                              // overflow: 'hidden',
                            }}
                          />
                        </ListItem>
                        <Divider component="li" sx={{ my: 1 }} />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            );
          })
        )}
      </Paper>

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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: '#D32F2F', fontWeight: 'bold' }}>
          {"Confirmer la suppression"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer le menu **"{menuToDelete?.name}"** ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteMenu} color="error" autoFocus variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement;