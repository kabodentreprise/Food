// src/components/OrderCard.jsx

import React from 'react'; // Removed useState, useEffect
import {
    Card, CardContent, Typography, Button, Box, Divider, Chip,
} from '@mui/material';
import {
    RoomService, AccessTime, LocationOn, Phone, MonetizationOn, CheckCircle, DeliveryDining
} from '@mui/icons-material';

const OrderCard = ({ order, onTake, onDeliver, showActions = false }) => {
    // Removed displayStatus state and localStorage logic

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'en_attente': return 'warning';
            case 'payé': return 'info';
            case 'en_preparation': return 'info';
            case 'prêt': return 'primary';
            case 'en_chemin': return 'secondary'; // Now directly uses 'en_chemin' from backend
            case 'livré': return 'success';
            case 'annulée': return 'default';
            case 'remboursée': return 'default';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'payé': return 'Payé';
            case 'en_preparation': return 'En préparation';
            case 'prêt': return 'Prête à livrer';
            case 'livré': return 'Livrée';
            case 'annulée': return 'Annulée';
            case 'remboursée': return 'Remboursée';
            case 'en_chemin': return 'En chemin'; // Directly uses 'en_chemin'
            case 'failed': return 'Échec livraison';
            default: return status;
        }
    };

    const numericTotal = parseFloat(order.total);
    const displayTotal = !isNaN(numericTotal) ? `${numericTotal.toFixed(2)} XOF` : 'N/A';

    const handleTakeButtonClick = () => {
        // Now directly calls the parent's onTake, which will handle the API call
        if (onTake && order.status === 'prêt') { // Ensure condition is met before calling
            onTake(order.id);
        }
    };

    const handleDeliverButtonClick = async () => {
        // This remains the same, as it already calls the parent's onDeliver
        try {
            await onDeliver(order.id);
        } catch (error) {
            console.error("Erreur lors de la livraison via OrderCard:", error);
            // Error handling (snackbar) is managed by the parent component
        }
    };

    return (
        <Card sx={cardStyles.root} elevation={3}>
            <CardContent>
                <Box sx={cardStyles.header}>
                    <Typography variant="h6" component="div" sx={cardStyles.orderId}>
                        Commande #{order.id}
                    </Typography>
                    <Chip
                        label={getStatusText(order.status)} // Use order.status directly
                        color={getStatusColor(order.status)} // Use order.status directly
                        size="small"
                        icon={<DeliveryDining />}
                        sx={cardStyles.chip}
                    />
                </Box>
                <Divider sx={{ my: 2 }} />

                <Box sx={cardStyles.details}>
                    <Typography variant="body2" color="text.secondary" sx={cardStyles.detailItem}>
                        <AccessTime sx={{ mr: 1 }} /> <strong>Date:</strong> {formatDateTime(order.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={cardStyles.detailItem}>
                        <MonetizationOn sx={{ mr: 1 }} /> <strong>Total:</strong> {displayTotal}
                    </Typography>
                    {order.user && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={cardStyles.detailItem}>
                                <RoomService sx={{ mr: 1 }} /> <strong>Client:</strong> {order.user.first_name} {order.user.last_name} ({order.user.email})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={cardStyles.detailItem}>
                                <Phone sx={{ mr: 1 }} /> <strong>Téléphone:</strong> {order.user.phone_number || 'N/A'}
                            </Typography>
                        </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={cardStyles.detailItem}>
                        <LocationOn sx={{ mr: 1 }} /> <strong>Adresse de livraison:</strong> {order.delivery_address || 'N/A'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={cardStyles.items}>
                    <Typography variant="subtitle2" gutterBottom>
                        Articles:
                    </Typography>
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                            <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                                - {item.quantity} x {item.menu?.name || 'Article inconnu'} ({
                                    !isNaN(parseFloat(item.menu?.price)) ?
                                        parseFloat(item.menu.price).toFixed(2) :
                                        'N/A'
                                } XOF/u)
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Aucun article.
                        </Typography>
                    )}
                </Box>

                {showActions && (
                    <Box sx={cardStyles.actions}>
                        {/* Le bouton "Prendre en charge" n'apparaît que si order.status est 'prêt' */}
                        {order.status === 'prêt' && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleTakeButtonClick}
                                startIcon={<DeliveryDining />}
                                sx={{ mr: 1 }}
                            >
                                Prendre en charge
                            </Button>
                        )}
                        {/* Le bouton "Livré" n'apparaît que si order.status est 'en_chemin' */}
                        {order.status === 'en_chemin' && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleDeliverButtonClick}
                                startIcon={<CheckCircle />}
                                sx={{ mr: 1 }}
                            >
                                Livré
                            </Button>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// Styles CSS intégrés pour OrderCard
const cardStyles = {
    root: {
        marginBottom: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
            transform: 'translateY(-5px)',
        },
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    orderId: {
        fontWeight: 'bold',
        color: '#3e2723',
    },
    chip: {
        fontWeight: 'bold',
    },
    details: {
        '& .MuiTypography-root': {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '5px',
        },
        '& .MuiSvgIcon-root': {
            marginRight: '8px',
            color: '#8B4513',
        },
    },
    items: {
        marginTop: '15px',
    },
    actions: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        '@media (max-width: 600px)': {
            flexDirection: 'column',
            alignItems: 'stretch',
            '& .MuiButton-root': {
                width: '100%',
                marginBottom: '10px',
                marginRight: '0 !important',
            },
        },
    },
};

export default OrderCard;