// src/pages/UserManagementPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, CircularProgress, Alert as MuiAlert, Snackbar, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { UserContext } from '../contexts/UserContext.jsx';

// Assurez-vous que cette URL pointe vers le microservice du Super Admin
const API_BASE_URL = process.env.REACT_APP_SUPER_ADMIN_API_URL;

const UserManagementPage = () => {
    const { token, isSuperAdmin } = useContext(UserContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" }); // Utilisation d'un seul objet pour le snackbar

    const showSnackbar = (message, severity = "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const fetchUsers = async () => {
        if (!token || !isSuperAdmin) {
            showSnackbar("Accès non autorisé. Veuillez vous connecter en tant que Super Administrateur.", "warning");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/super_admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Assurez-vous que l'ID est toujours présent. Si le backend garantit un `id`, `|| index` n'est pas strictement nécessaire.
            const usersWithIds = response.data.map(user => ({
                ...user,
                id: user.id, // Предпоose que l'ID est toujours fourni par le backend
            }));
            setUsers(usersWithIds);
            showSnackbar("Liste des utilisateurs chargée.", "success");
        } catch (error) {
            console.error("Erreur lors du chargement des utilisateurs:", error);
            const errorMessage = error.response?.data?.detail || "Erreur lors du chargement des utilisateurs.";
            showSnackbar(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token, isSuperAdmin]); // Dépendances pour recharger si le token ou le rôle change

    const updatePermissionStatus = async (userId, endpoint, payloadKey, currentValue, successMessage, failureMessage) => {
        if (!token || !isSuperAdmin) {
            showSnackbar("Accès non autorisé pour modifier les permissions.", "error");
            return;
        }
        try {
            const payload = { [payloadKey]: !currentValue };
            const response = await axios.put(
                `${API_BASE_URL}/super_admin/users/${userId}/${endpoint}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showSnackbar(`${successMessage} de ${response.data.email} mis à jour.`, "success");
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, [payloadKey]: response.data[payloadKey] } : user
            ));
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut ${payloadKey}:`, error);
            const errorMessage = error.response?.data?.detail || failureMessage;
            showSnackbar(errorMessage, "error");
        }
    };

    const handleToggleAdminStatus = (userId, currentIsAdmin) => {
        updatePermissionStatus(
            userId,
            "set-admin-status",
            "is_admin",
            currentIsAdmin,
            "Statut Admin",
            "Échec de la mise à jour du statut Admin."
        );
    };

    const handleToggleSuperAdminStatus = (userId, currentIsSuperAdmin) => {
        updatePermissionStatus(
            userId,
            "set-super-admin-status",
            "is_super_admin",
            currentIsSuperAdmin,
            "Statut Super Admin",
            "Échec de la mise à jour du statut Super Admin."
        );
    };

    const handleToggleLivreurStatus = (userId, currentIsLivreur) => {
        updatePermissionStatus(
            userId,
            "set-livreur-status",
            "is_livreur",
            currentIsLivreur,
            "Statut Livreur",
            "Échec de la mise à jour du statut Livreur."
        );
    };

    const handleToggleActiveStatus = (userId, currentIsActive) => {
        updatePermissionStatus(
            userId,
            "set-active-status",
            "is_active",
            currentIsActive,
            "Statut Actif",
            "Échec de la mise à jour du statut Actif."
        );
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'first_name', headerName: 'Prénom', width: 130 },
        { field: 'last_name', headerName: 'Nom', width: 130 },
        { field: 'phone_number', headerName: 'Téléphone', width: 150 },
        { field: 'delivery_address', headerName: 'Adresse de livraison', width: 200 },
        {
            field: 'is_active',
            headerName: 'Actif',
            width: 100,
            type: 'boolean',
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    color={params.value ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleActiveStatus(params.row.id, params.value)}
                >
                    {params.value ? 'Oui' : 'Non'}
                </Button>
            )
        },
        {
            field: 'is_admin',
            headerName: 'Admin',
            width: 100,
            type: 'boolean',
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    color={params.value ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleAdminStatus(params.row.id, params.value)}
                >
                    {params.value ? 'Oui' : 'Non'}
                </Button>
            )
        },
        {
            field: 'is_super_admin',
            headerName: 'Super Admin',
            width: 150,
            type: 'boolean',
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    color={params.value ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleSuperAdminStatus(params.row.id, params.value)}
                >
                    {params.value ? 'Oui' : 'Non'}
                </Button>
            )
        },
        {
            field: 'is_livreur',
            headerName: 'Livreur',
            width: 120,
            type: 'boolean',
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    // CORRECTION ICI: Changer "default" en "inherit" ou "warning" ou "error"
                    // ou simplement "undefined" pour utiliser le style par défaut du bouton.
                    // "inherit" est souvent un bon choix pour un état neutre/non coloré.
                    color={params.value ? "primary" : "inherit"}
                    size="small"
                    onClick={() => handleToggleLivreurStatus(params.row.id, params.value)}
                >
                    {params.value ? 'Oui' : 'Non'}
                </Button>
            )
        },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress color="warning" /> {/* Couleur cohérente */}
                <Typography sx={{ ml: 2, color: '#8B4513' }}>Chargement des utilisateurs...</Typography>
            </Box>
        );
    }

    if (!isSuperAdmin) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <MuiAlert severity="error" sx={{ mb: 2 }}> {/* Severity "error" plus appropriée pour accès refusé */}
                    Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                </MuiAlert>
                <Typography variant="body1" color="text.secondary">
                    Veuillez vous connecter avec un compte Super Administrateur.
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#8B4513', mb: 3 }}>
                    Gestion des Utilisateurs
                </Typography>
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        getRowId={(row) => row.id} // S'assurer que chaque utilisateur a bien un 'id' unique
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        pagination
                        autoHeight={false}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#FFD700',
                                color: '#8B4513',
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-row': {
                                '&:nth-of-type(odd)': {
                                    backgroundColor: '#FFF8DC',
                                },
                            },
                            border: '1px solid #FFD700',
                        }}
                        disableRowSelectionOnClick // Empêche la sélection de ligne entière au clic du bouton
                    />
                </Box>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Container>
    );
};

export default UserManagementPage;