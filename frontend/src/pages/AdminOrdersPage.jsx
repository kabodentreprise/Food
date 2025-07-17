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
import { UserContext } from '../contexts/UserContext.jsx'; // Assurez-vous que le chemin est correct

const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL;
const PAIEMENT_API_URL = process.env.REACT_APP_PAIEMENT_API_URL;

const STATUS_OPTIONS_FOR_PREPARATION = [
    { value: 'en_preparation', label: 'En préparation', disabled: true }, // Statut initial de cette page
    { value: 'prêt', label: 'Prête' },
    { value: 'en_chemin', label: 'En chemin' },
    { value: 'livré', label: 'Livrée' },
    { value: 'annulée', label: 'Annulée' },
];

const statusColors = {
    "en_attente": "default",
    "payé": "info",
    "en_preparation": "primary",
    "prêt": "warning",
    "en_chemin": "secondary",
    "livré": "success",
    "annulée": "error",
    "remboursée": "success"
};

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [statusUpdating, setStatusUpdating] = useState({});
    const { user, isAuthenticated } = useContext(UserContext);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [selectedOrderToConfirm, setSelectedOrderToConfirm] = useState(null);
    const [newStatusToConfirm, setNewStatusToConfirm] = useState('');

    const fetchMyOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("fetchMyOrders: Jeton d'authentification manquant.");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                setLoading(false);
                return;
            }
            if (!user?.id) {
                console.warn("fetchMyOrders: ID utilisateur non disponible. Impossible de récupérer les commandes.");
                setLoading(false);
                return;
            }

            // Endpoint pour récupérer les commandes assignées à l'administrateur actuel et en préparation
            // Assurez-vous que votre backend a un endpoint comme /admin/orders/assigned/{admin_id}
            // qui filtre par livreur_user_id et par statut.
            // Si non, vous devrez filtrer côté client, mais c'est moins efficace.
            // Pour l'exemple, nous allons filtrer côté client si le backend n'a pas ce filtre exact.
            const res = await axios.get(`${ADMIN_API_URL}/admin/orders/active`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Filtrer les commandes côté client: statut 'en_preparation' et assignées à l'admin actuel
            const myOrders = res.data.filter(order =>
                order.status === 'en_preparation' && order.livreur_user?.id === user.id
            );
            setOrders(myOrders);

        } catch (err) {
            console.error("fetchMyOrders: Erreur lors du chargement de vos commandes:", err.response?.data || err.message, err);
            setSnackbar({ open: true, message: "Erreur lors du chargement de vos commandes.", severity: "error" });
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || (!user?.is_admin && !user?.is_super_admin)) {
            setSnackbar({ open: true, message: "Accès non autorisé. Vous devez être administrateur.", severity: "error" });
            setLoading(false);
            return;
        }
        fetchMyOrders();
    }, [isAuthenticated, user]);

    const handleChangeStatus = (order, newStatus) => {
        setSelectedOrderToConfirm(order);
        setNewStatusToConfirm(newStatus);
        setOpenConfirmDialog(true);
    };

    const confirmStatusChange = async () => {
        setOpenConfirmDialog(false);
        const order = selectedOrderToConfirm;
        const newStatus = newStatusToConfirm;

        if (!order || !newStatus) return;

        setStatusUpdating((prev) => ({ ...prev, [order.id]: true }));
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("confirmStatusChange: Jeton d'authentification manquant.");
                setSnackbar({ open: true, message: "Jeton d'authentification manquant. Veuillez vous reconnecter.", severity: "error" });
                return;
            }

            await axios.put(
                `${ADMIN_API_URL}/admin/order/${order.id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbar({ open: true, message: "Statut de la commande mis à jour.", severity: "success" });

            if (newStatus === "annulée") {
                if (order.status === "payé" || order.status === "en_preparation" || order.status === "prêt" || order.status === "en_chemin") {
                    await handleRefund(order);
                } else {
                    setSnackbar({ open: true, message: "Commande annulée, mais aucun remboursement n'a été déclenché car elle n'était pas dans un statut 'payé'.", severity: "info" });
                }
            }
            fetchMyOrders(); // Rafraîchit les commandes pour cette page
        } catch (err) {
            console.error(
                `confirmStatusChange: Erreur lors de la mise à jour du statut pour commande ${order.id} vers "${newStatus}":`,
                err.response?.data || err.message,
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
                <Typography variant="h6" sx={{ mt: 2 }}>Chargement de vos commandes...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
            <Typography variant="h4" fontWeight="bold" align="center" sx={{ mb: 4, color: "#8B4513" }}>
                Mes Commandes en Préparation
            </Typography>

            {orders.length === 0 ? (
                <Card elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, textAlign: 'center', mt: 4 }}>
                    <CardContent>
                        <Typography variant="h6" align="center" color="text.secondary" sx={{ py: 6 }}>
                            Aucune commande ne vous est assignée pour la préparation.
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
                                                    ? `${order.livreur_user.first_name || ''} ${order.livreur_user.last_name || ''}`.trim()
                                                    : <Typography component="span" color="text.secondary" variant="body2">Non assigné</Typography>
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id={`status-select-label-${order.id}`}>Changer Statut</InputLabel>
                                                <Select
                                                    labelId={`status-select-label-${order.id}`}
                                                    label="Changer Statut"
                                                    value={order.status}
                                                    onChange={e => handleChangeStatus(order, e.target.value)}
                                                    disabled={statusUpdating[order.id] || ['livré', 'annulée', 'remboursée'].includes(order.status)}
                                                >
                                                    {STATUS_OPTIONS_FOR_PREPARATION.map(opt => (
                                                        <MenuItem
                                                            key={opt.value}
                                                            value={opt.value}
                                                            disabled={
                                                                opt.disabled ||
                                                                (opt.value === 'prêt' && order.status !== 'en_preparation') ||
                                                                (opt.value === 'en_chemin' && order.status !== 'prêt') ||
                                                                (opt.value === 'livré' && !['prêt', 'en_chemin'].includes(order.status)) ||
                                                                (opt.value === 'annulée' && ['livré', 'remboursée'].includes(order.status)) ||
                                                                (opt.value === order.status)
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
                        vers "{STATUS_OPTIONS_FOR_PREPARATION.find(opt => opt.value === newStatusToConfirm)?.label}" ?
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

export default AdminOrdersPage;