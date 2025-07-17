// src/AdminDashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    CircularProgress,
    Box,
    FormControl,
    InputLabel,
    Chip,
    List,
    ListItem,
    ListItemText,
    Grid,
    Divider,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { UserContext } from '../contexts/UserContext.jsx';

// URLs depuis .env
const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL;
const PAIEMENT_API_URL = process.env.REACT_APP_PAIEMENT_API_URL;

// IMPORTANT: Mise à jour des options de statut pour inclure 'en_chemin'
// Assurez-vous que l'ordre des statuts est logique pour les transitions possibles par l'admin.
const STATUS_OPTIONS_FOR_PAID = [
    { value: 'payé', label: 'Payée', disabled: true }, // 'payé' reste désactivé car c'est le statut initial de ces commandes
    { value: 'en_preparation', label: 'En préparation' },
    { value: 'prêt', label: 'Prêt' },
    { value: 'en_chemin', label: 'En chemin' }, // NOUVEAU STATUT AJOUTÉ
    { value: 'livré', label: 'Livrée' }, // L'admin peut passer à livré si prêt ou en_chemin
    { value: 'annulée', label: 'Annulée' },
];

// NOUVEAU: Pour colorer les chips de statut, ajoutez la couleur pour 'en_chemin'
const statusColors = {
    "en_attente": "default",
    "payé": "info",
    "en_preparation": "primary",
    "prêt": "warning",
    "en_chemin": "secondary", // Nouvelle couleur pour 'en_chemin'
    "livré": "success",
    "annulée": "error",
    "remboursée": "success" // Ajouté si 'remboursée' est aussi un statut final visible ici
};

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [livreurs, setLivreurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [statusUpdating, setStatusUpdating] = useState({});
    const [assigningLivreur, setAssigningLivreur] = useState({});
    const { user, isAuthenticated } = useContext(UserContext);

    // State for confirmation dialog
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [selectedOrderToConfirm, setSelectedOrderToConfirm] = useState(null);
    const [newStatusToConfirm, setNewStatusToConfirm] = useState('');

    // Fetch only "payé" orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("fetchOrders: Jeton d'authentification manquant dans localStorage (clé 'token').");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                setLoading(false);
                return;
            }

            // Assurez-vous que votre endpoint backend '/admin/orders/active' renvoie tous les statuts pertinents
            // (payé, en_preparation, prêt, en_chemin) pour l'admin.
            const res = await axios.get(`${ADMIN_API_URL}/admin/orders/active`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(res.data);
        } catch (err) {
            console.error("fetchOrders: Erreur lors du chargement des commandes:", err.response?.data || err.message, err);
            setSnackbar({ open: true, message: "Erreur lors du chargement des commandes.", severity: "error" });
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Load the list of delivery personnel
    const fetchLivreurs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("fetchLivreurs: Jeton d'authentification manquant dans localStorage (clé 'token').");
                return;
            }

            const res = await axios.get(`${ADMIN_API_URL}/admin/livreur`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLivreurs(res.data);
        } catch (err) {
            console.error("fetchLivreurs: Erreur lors du chargement des livreurs:", err.response?.data || err.message, err);
            setSnackbar({ open: true, message: "Erreur lors du chargement des livreurs.", severity: "error" });
            setLivreurs([]);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || (!user?.is_admin && !user?.is_super_admin)) {
            setSnackbar({ open: true, message: "Accès non autorisé. Vous devez être administrateur.", severity: "error" });
            setLoading(false);
            return;
        }
        fetchOrders();
        fetchLivreurs();
    }, [isAuthenticated, user]);

    // Assign a delivery person to an order
    const handleAssignLivreur = async (orderId, livreurId) => {
        setAssigningLivreur(prev => ({ ...prev, [orderId]: true }));
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("handleAssignLivreur: Jeton d'authentification manquant pour l'assignation du livreur.");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                return;
            }

            await axios.put(
                `${ADMIN_API_URL}/admin/order/${orderId}/assign-livreur/`,
                { livreur_id: livreurId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbar({ open: true, message: "Livreur assigné avec succès.", severity: "success" });
            fetchOrders();
        } catch (err) {
            console.error(
                `handleAssignLivreur: Erreur lors de l'assignation du livreur pour commande ${orderId}, livreur ${livreurId}:`,
                err.response?.data || err.message,
                "Statut HTTP:", err.response?.status,
                "URL de la requête:", `${ADMIN_API_URL}/admin/order/${orderId}/assign-livreur/`,
                err
            );
            setSnackbar({ open: true, message: "Erreur lors de l'assignation du livreur. Vérifiez la console pour plus de détails.", severity: "error" });
        } finally {
            setAssigningLivreur(prev => ({ ...prev, [orderId]: false }));
        }
    };

    // Open confirmation dialog before changing status
    const handleChangeStatus = (order, newStatus) => {
        // Logique pour les transitions de statut (potentiellement plus complexe avec le nouveau statut)
        // La règle suivante a été modifiée : un livreur n'est plus obligatoire pour passer 'en_preparation'
        // if (newStatus === "en_preparation" && !order.livreur_user) {
        //     setSnackbar({ open: true, message: "Veuillez assigner un livreur avant de passer la commande 'En préparation'.", severity: "warning" });
        //     return; // Prevent status update
        // }

        // Ajoutez d'autres règles si nécessaire, par exemple :
        // if (newStatus === "en_chemin" && order.status !== "prêt") {
        //     setSnackbar({ open: true, message: "La commande doit être 'Prête' avant de passer 'En chemin'.", severity: "warning" });
        //     return;
        // }
        // if (newStatus === "livré" && order.status !== "prêt" && order.status !== "en_chemin") {
        //     setSnackbar({ open: true, message: "La commande doit être 'Prête' ou 'En chemin' avant de passer 'Livrée'.", severity: "warning" });
        //     return;
        // }

        setSelectedOrderToConfirm(order);
        setNewStatusToConfirm(newStatus);
        setOpenConfirmDialog(true);
    };

    // Handles the actual status change after confirmation
    const confirmStatusChange = async () => {
        setOpenConfirmDialog(false); // Close the dialog
        const order = selectedOrderToConfirm;
        const newStatus = newStatusToConfirm;

        if (!order || !newStatus) return; // Should not happen if dialog is opened correctly

        setStatusUpdating((prev) => ({ ...prev, [order.id]: true }));
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("confirmStatusChange: Jeton d'authentification manquant pour le changement de statut.");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                return;
            }

            await axios.put(
                `${ADMIN_API_URL}/admin/order/${order.id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbar({ open: true, message: "Statut de la commande mis à jour.", severity: "success" });

            // Si le statut est "annulée" ET qu'il était "payé" (ou un autre statut nécessitant un remboursement)
            // C'est une bonne pratique de vérifier l'ancien statut si votre backend ne le gère pas.
            // Cependant, si votre backend gère déjà l'historique et la logique de remboursement,
            // cette condition ici est juste un confort visuel ou une double-vérification.
            if (newStatus === "annulée") {
                 // Remboursement uniquement si la commande était payée ou si elle avait déjà un paiement enregistré
                if (order.status === "payé" || order.status === "en_preparation" || order.status === "prêt" || order.status === "en_chemin") {
                    await handleRefund(order);
                } else {
                    setSnackbar({ open: true, message: "Commande annulée, mais aucun remboursement n'a été déclenché car elle n'était pas dans un statut 'payé'.", severity: "info" });
                }
            }
            fetchOrders();
        } catch (err) {
            console.error(
                `confirmStatusChange: Erreur lors de la mise à jour du statut pour commande ${order.id} vers "${newStatus}":`,
                err.response?.data || err.message,
                "Statut HTTP:", err.response?.status,
                "Corps de la requête:", { status: newStatus },
                err
            );
            setSnackbar({ open: true, message: "Erreur lors de la mise à jour du statut. Vérifiez la console pour plus de détails.", severity: "error" });
        } finally {
            setStatusUpdating((prev) => ({ ...prev, [order.id]: false }));
            setSelectedOrderToConfirm(null);
            setNewStatusToConfirm('');
        }
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
        setSelectedOrderToConfirm(null);
        setNewStatusToConfirm('');
    };

    // Trigger a full refund (called when an order is canceled)
    const handleRefund = async (order) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("handleRefund: Jeton d'authentification manquant pour le remboursement.");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                return;
            }

            await axios.post(
                `${PAIEMENT_API_URL}/paiement/admin/refund`,
                { order_id: order.id, amount: order.total },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbar({ open: true, message: "Remboursement total effectué au client.", severity: "info" });
        } catch (err) {
            console.error("handleRefund: Erreur lors du remboursement du client:", err.response?.data || err.message, err);
            setSnackbar({ open: true, message: "Erreur lors du remboursement du client.", severity: "error" });
        }
    };

    const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

    if (loading) {
        return (
            <Container sx={{ mt: 8, textAlign: 'center' }}>
                <CircularProgress color="warning" />
                <Typography variant="h6" sx={{ mt: 2 }}>Chargement des commandes...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
            <Typography variant="h4" fontWeight="bold" align="center" sx={{ mb: 4, color: "#8B4513" }}>
                Tableau de Bord Administrateur - Commandes Actives
            </Typography>

            {orders.length === 0 ? (
                <Card elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, textAlign: 'center', mt: 4 }}>
                    <CardContent>
                        <Typography variant="h6" align="center" color="text.secondary" sx={{ py: 6 }}>
                            Aucune commande active trouvée.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {orders.map(order => (
                        <Grid item xs={12} key={order.id}>
                            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Commande #{order.id}
                                        </Typography>
                                        <Chip
                                            label={order.status.toUpperCase()}
                                            color={statusColors[order.status] || "default"}
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Typography variant="body1">
                                                <Typography component="span" fontWeight="bold">Client : </Typography>
                                                {order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() : 'N/A'}
                                            </Typography>
                                            <Typography variant="body1">
                                                <Typography component="span" fontWeight="bold">Adresse : </Typography>
                                                {order.delivery_address || 'Non spécifiée'}
                                            </Typography>
                                            <Typography variant="body1">
                                                <Typography component="span" fontWeight="bold">Date : </Typography>
                                                {new Date(order.created_at).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Typography variant="body1">
                                                <Typography component="span" fontWeight="bold">Total : </Typography>
                                                {order.total} FCFA
                                            </Typography>
                                            <Typography variant="body1">
                                                <Typography component="span" fontWeight="bold">Livreur assigné : </Typography>
                                                {order.livreur_user
                                                    ? `${order.livreur_user.first_name || ''} ${order.user.last_name || ''}`.trim()
                                                    : <Typography component="span" color="text.secondary" variant="body2">Non assigné</Typography>
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                                <InputLabel id={`livreur-select-label-${order.id}`}>Assigner Livreur</InputLabel>
                                                <Select
                                                    labelId={`livreur-select-label-${order.id}`}
                                                    label="Assigner Livreur"
                                                    value={order.livreur_user ? order.livreur_user.id : ""}
                                                    onChange={e => handleAssignLivreur(order.id, e.target.value)}
                                                    // Le livreur peut être assigné tant que la commande n'est pas livrée ou annulée
                                                    disabled={assigningLivreur[order.id] || ['livré', 'annulée', 'remboursée'].includes(order.status)}
                                                >
                                                    <MenuItem value="">Aucun</MenuItem>
                                                    {livreurs.map(l =>
                                                        <MenuItem key={l.id} value={l.id}>
                                                            {`${l.first_name || ''} ${l.last_name || ''}`.trim()}
                                                        </MenuItem>
                                                    )}
                                                </Select>
                                            </FormControl>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id={`status-select-label-${order.id}`}>Changer Statut</InputLabel>
                                                <Select
                                                    labelId={`status-select-label-${order.id}`}
                                                    label="Changer Statut"
                                                    value={order.status}
                                                    onChange={e => handleChangeStatus(order, e.target.value)}
                                                    disabled={statusUpdating[order.id] || ['livré', 'annulée', 'remboursée'].includes(order.status)} // Désactive si déjà un statut final
                                                >
                                                    {STATUS_OPTIONS_FOR_PAID.map(opt => (
                                                        <MenuItem
                                                            key={opt.value}
                                                            value={opt.value}
                                                            disabled={
                                                                opt.disabled ||
                                                                // Permet de passer de 'payé' à 'prêt' directement
                                                                // Ancienne logique : (opt.value === 'prêt' && order.status !== 'en_preparation') ||
                                                                (opt.value === 'prêt' && !['payé', 'en_preparation'].includes(order.status)) ||
                                                                (opt.value === 'en_chemin' && order.status !== 'prêt') || // Logique pour 'en_chemin'
                                                                (opt.value === 'livré' && !['prêt', 'en_chemin'].includes(order.status)) || // Peut être livré si prêt ou en_chemin
                                                                (opt.value === 'annulée' && ['livré', 'remboursée'].includes(order.status)) || // Ne peut pas annuler une commande livrée ou remboursée
                                                                (opt.value === order.status) // Désactive l'option si c'est le statut actuel
                                                            }
                                                        >
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ mt: 3, mb: 2 }} />

                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                        Articles de la Commande :
                                    </Typography>
                                    <List dense disablePadding>
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, index) => (
                                                <ListItem key={index} disableGutters>
                                                    <ListItemText
                                                        primary={`${item.menu?.name || 'Menu inconnu'} (x${item.quantity || 1})`}
                                                        secondary={item.price ? `${item.price} FCFA` : ''}
                                                    />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">Aucun article dans cette commande.</Typography>
                                        )}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                <DialogTitle id="confirm-dialog-title">{"Confirmer le changement de statut ?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-dialog-description">
                        Êtes-vous sûr de vouloir changer le statut de la commande #{selectedOrderToConfirm?.id}
                        vers "{STATUS_OPTIONS_FOR_PAID.find(opt => opt.value === newStatusToConfirm)?.label}" ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Annuler
                    </Button>
                    <Button onClick={confirmStatusChange} color="primary" autoFocus>
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;