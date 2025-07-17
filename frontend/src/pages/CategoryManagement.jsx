// src/pages/CategoryManagement.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { UserContext } from '../contexts/UserContext.jsx';

// Utilise l'URL du microservice catégorie depuis le .env
const CATEGORIE_API_URL = process.env.REACT_APP_CATEGORIE_API_URL;

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CategoryManagement = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);

  const { token } = useContext(UserContext);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Récupère les catégories (auth requise)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${CATEGORIE_API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
      if (onCategoryChange) onCategoryChange(res.data);
    } catch (error) {
      setCategories([]);
      if (onCategoryChange) onCategoryChange([]);
      showSnackbar("Impossible de charger les catégories.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    } else {
      setLoading(false);
      showSnackbar("Veuillez vous connecter pour gérer les catégories.", "info");
    }
    // eslint-disable-next-line
  }, [token]);

  // Ajout d'une catégorie
  const handleAdd = async (e) => {
    e.preventDefault();
    setSnackbarOpen(false);
    if (!name.trim()) {
      showSnackbar("Le nom de la catégorie ne peut pas être vide.", "warning");
      return;
    }
    if (!token) {
      showSnackbar("Vous devez être connecté pour ajouter une catégorie.", "error");
      return;
    }
    try {
      const res = await axios.post(
        `${CATEGORIE_API_URL}/categories`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName("");
      fetchCategories();
      showSnackbar(`Catégorie "${res.data.name}" ajoutée avec succès !`, "success");
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || "Erreur lors de l'ajout de la catégorie.",
        "error"
      );
    }
  };

  // Préparation de l'édition
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  // Mise à jour d'une catégorie
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSnackbarOpen(false);
    if (!editingName.trim()) {
      showSnackbar("Le nom de la catégorie ne peut pas être vide.", "warning");
      return;
    }
    if (!token) {
      showSnackbar("Vous devez être connecté pour modifier une catégorie.", "error");
      return;
    }
    try {
      const res = await axios.put(
        `${CATEGORIE_API_URL}/categories/${editingId}`,
        { name: editingName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditingName("");
      fetchCategories();
      showSnackbar(`Catégorie mise à jour vers "${res.data.name}" !`, "success");
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || "Erreur lors de la mise à jour de la catégorie.",
        "error"
      );
    }
  };

  // Demande de confirmation suppression
  const confirmDelete = (id) => {
    setCategoryIdToDelete(id);
    setDialogOpen(true);
  };

  // Suppression d'une catégorie
  const handleDelete = async () => {
    setDialogOpen(false);
    setSnackbarOpen(false);
    if (!token) {
      showSnackbar("Vous devez être connecté pour supprimer une catégorie.", "error");
      return;
    }
    try {
      await axios.delete(
        `${CATEGORIE_API_URL}/categories/${categoryIdToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCategories();
      showSnackbar("Catégorie supprimée avec succès !", "success");
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || "Erreur lors de la suppression de la catégorie.",
        "error"
      );
    } finally {
      setCategoryIdToDelete(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)' }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold', color: '#8B4513', mb: 3 }}
        >
          Gestion des Catégories
        </Typography>

        {/* Formulaire d'ajout/édition */}
        <Box component="form" onSubmit={editingId ? handleUpdate : handleAdd} sx={{ display: "flex", gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            label={editingId ? "Modifier la catégorie" : "Nom de la nouvelle catégorie"}
            value={editingId ? editingName : name}
            onChange={e => editingId ? setEditingName(e.target.value) : setName(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#FFD700' },
                '&:hover fieldset': { borderColor: '#FFC107' },
                '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="warning"
            sx={{
              whiteSpace: 'nowrap',
              boxShadow: '0px 4px 10px rgba(255, 152, 0, 0.3)',
              '&:hover': {
                backgroundColor: '#e68a00',
                boxShadow: '0px 6px 15px rgba(255, 152, 0, 0.5)',
              },
            }}
            startIcon={editingId ? <SaveIcon /> : <AddCircleOutlineIcon />}
          >
            {editingId ? "Modifier" : "Ajouter"}
          </Button>
          {editingId && (
            <IconButton
              color="error"
              onClick={handleCancelEdit}
              sx={{ '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' } }}
            >
              <CancelIcon />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Liste des catégories */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="warning" />
            <Typography variant="body1" sx={{ ml: 2, color: '#8B4513' }}>Chargement des catégories...</Typography>
          </Box>
        ) : categories.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ color: 'text.secondary', py: 4 }}>
            Aucune catégorie disponible. Ajoutez-en une nouvelle !
          </Typography>
        ) : (
          <List>
            {categories.map(cat => (
              <React.Fragment key={cat.id}>
                <ListItem
                  sx={{
                    bgcolor: editingId === cat.id ? '#FFF3E0' : 'inherit',
                    borderRadius: 1,
                    mb: 1,
                    py: 1.5,
                    transition: 'background-color 0.3s ease',
                  }}
                  secondaryAction={
                    <>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEdit(cat)}
                        sx={{ color: '#E65100', '&:hover': { backgroundColor: 'rgba(230, 81, 0, 0.1)' } }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => confirmDelete(cat.id)}
                        sx={{ color: '#D32F2F', '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText primary={
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: editingId === cat.id ? 'bold' : 'normal', color: '#3E2723' }}
                    >
                      {cat.name}
                    </Typography>
                  } />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Snackbar pour les notifications */}
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

      {/* Dialogue de confirmation de suppression */}
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
            Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible et supprimera également les menus associés.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryManagement;
