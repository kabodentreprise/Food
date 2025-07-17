import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Tooltip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { UserContext } from "../contexts/UserContext";

// Utilise l'URL du microservice super_admin
const SUPER_ADMIN_API_URL = process.env.REACT_APP_SUPER_ADMIN_API_URL;

const statusOptions = [
  { value: "en_attente", label: "En attente" },
  { value: "payé", label: "Payée" },
  { value: "en_preparation", label: "En préparation" },
  { value: "prêt", label: "Prête" },
  { value: "en_chemin", label: "En chemin" },
  { value: "livré", label: "Livrée" },
  { value: "annulée", label: "Annulée" },
  { value: "remboursée", label: "Remboursée" },
];

const getStatusLabel = (value) => {
  const option = statusOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};

// Définir des couleurs pour les statuts (même si le graphique est retiré, ces couleurs peuvent servir à autre chose)
const statusColors = {
  "en_attente": "#FFC107", // Jaune
  "payé": "#4CAF50",       // Vert
  "en_preparation": "#2196F3", // Bleu
  "prêt": "#00BCD4",       // Cyan
  "en_chemin": "#FF9800",  // Orange
  "livré": "#3F51B5",       // Indigo
  "annulée": "#F44336",    // Rouge
  "remboursée": "#9C27B0", // Violet
};

const OrderManagement = () => {
  const { token, isAdmin, isSuperAdmin } = useContext(UserContext);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SUPER_ADMIN_API_URL}/super_admin/orders`, { headers });
      const ordersData = res.data;

      let currentTotalRevenue = 0;
      let currentTotalOrdersCount = ordersData.length;

      const grouped = ordersData.reduce((acc, order) => {
        // **CORRECTION ICI : Assurer que userId est toujours une chaîne et que l'objet user a un ID**
        const userId = order.user?.id ? String(order.user.id) : `unknown-user-${order.id}`;

        if (!acc[userId]) {
          acc[userId] = {
            // Assurez-vous que l'objet user a toujours une propriété 'id' valide
            user: {
              id: userId, // Utilisation de userId comme ID de l'utilisateur
              first_name: order.user?.first_name || "Inconnu",
              last_name: order.user?.last_name || "",
              email: order.user?.email || "N/A", // Ajoutez d'autres champs si nécessaire
              phone_number: order.user?.phone_number || "N/A",
            },
            orders: [],
            totalPaidOrdersAmount: 0,
          };
        }
        acc[userId].orders.push(order);
        if (order.status === "payé" || order.status === "livré") {
          const orderTotal = parseFloat(order.total);
          acc[userId].totalPaidOrdersAmount += orderTotal;
          currentTotalRevenue += orderTotal;
        }
        return acc;
      }, {});
      setGroupedOrders(grouped);
      setTotalRevenue(currentTotalRevenue);
      setTotalOrdersCount(currentTotalOrdersCount);

    } catch (error) {
      const message = error.response?.data?.detail || "Erreur lors du chargement des commandes";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && (isAdmin || isSuperAdmin)) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token, isAdmin, isSuperAdmin]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (!token || (!isAdmin && !isSuperAdmin)) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Accès refusé. Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Typography>
      </Container>
    );
  }

  const orderColumns = [
    { field: "id", headerName: "ID Commande", width: 100 },
    {
      field: "total",
      headerName: "Total Commande",
      width: 150,
      valueFormatter: (params) => `${parseFloat(params.value).toFixed(2)} FCFA`,
    },
    {
      field: "status",
      headerName: "Statut",
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
          {getStatusLabel(params.value)}
        </Typography>
      ),
    },
    {
      field: "livreurName",
      headerName: "Livreur",
      width: 150,
      valueGetter: (params) => {
        const livreur = params.row.livreur_user;
        return livreur ? `${livreur.first_name || ""} ${livreur.last_name || ""}`.trim() : "Non assigné";
      },
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "delivery_address",
      headerName: "Adresse de livraison",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value || "Non spécifiée"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "created_at",
      headerName: "Date de création",
      width: 180,
      valueFormatter: (params) => {
        try {
          return new Date(params.value).toLocaleString("fr-FR");
        } catch (e) {
          return "Date invalide";
        }
      },
    },
    {
      field: "items",
      headerName: "Articles Commandés",
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Tooltip
          title={
            <Box>
              {params.value && params.value.length > 0 ? (
                params.value.map((item, index) => (
                  <Typography key={index} variant="caption" display="block">
                    {item.quantity}x {item.menu?.name || "Article inconnu"} ({parseFloat(item.menu?.price || 0).toFixed(2)} FCFA/unité)
                  </Typography>
                ))
              ) : (
                <Typography variant="caption">Aucun article</Typography>
              )}
            </Box>
          }
        >
          <Typography variant="body2" noWrap>
            {params.value && params.value.length > 0
              ? params.value.map(item => `${item.quantity}x ${item.menu?.name || ""}`).join(", ")
              : "Aucun article"}
          </Typography>
        </Tooltip>
      ),
    },
  ];

  const filteredGroupedOrders = Object.entries(groupedOrders).reduce((acc, [userId, userData]) => {
    const filteredUserOrders = filterStatus
      ? userData.orders.filter(order => order.status === filterStatus)
      : userData.orders;

    if (filteredUserOrders.length > 0) {
      const totalFilteredPaidAmount = filteredUserOrders.reduce((sum, order) => {
        return (order.status === "payé" || order.status === "livré") ? sum + parseFloat(order.total) : sum;
      }, 0);

      acc[userId] = {
        ...userData,
        orders: filteredUserOrders,
        totalPaidOrdersAmount: totalFilteredPaidAmount,
      };
    }
    return acc;
  }, {});

  const sortedUsers = Object.values(filteredGroupedOrders).sort((a, b) => b.totalPaidOrdersAmount - a.totalPaidOrdersAmount);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight="bold" color="#E65100" gutterBottom>
        Gestion des Commandes par Client
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ mr: 1 }}>Filtrer par statut:</Typography>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Toutes les commandes</MenuItem>
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        {filterStatus && (
            <Button
                onClick={() => setFilterStatus("")}
                sx={{ ml: 2 }}
                variant="outlined"
                color="secondary"
            >
                Réinitialiser le filtre
            </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress color="warning" />
        </Box>
      ) : sortedUsers.length === 0 ? (
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
          Aucune commande trouvée.
        </Typography>
      ) : (
        <>
          <Divider sx={{ my: 4 }} />

          {sortedUsers.map((userData) => (
            <Accordion
              key={userData.user.id} // Assurez-vous que l'ID est toujours une chaîne
              expanded={expanded === userData.user.id}
              onChange={handleAccordionChange(userData.user.id)}
              sx={{ mb: 2, border: '1px solid #ddd', borderRadius: 2, boxShadow: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                // L'ID doit être une chaîne valide pour aria-controls et id
                aria-controls={`panel-${userData.user.id}-content`}
                id={`panel-${userData.user.id}-header`}
                sx={{ bgcolor: '#ffe0b2', borderBottom: '1px solid #ddd' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="h6" color="#E65100">
                    Client: {userData.user.first_name} {userData.user.last_name} ({userData.orders.length} commande(s))
                  </Typography>
                  <Typography variant="subtitle1" color="#D32F2F" fontWeight="bold" sx={{ mr: 2 }}>
                    Total des commandes honorées: {userData.totalPaidOrdersAmount.toFixed(2)} FCFA
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <DataGrid
                  rows={userData.orders}
                  columns={orderColumns}
                  getRowId={(row) => row.id}
                  autoHeight
                  pageSizeOptions={[5, 10, 20]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  sx={{ bgcolor: "#fff", borderRadius: 2 }}
                  disableRowSelectionOnClick
                />
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider sx={{ my: 4 }} />

          {/* Affichage des Statistiques Globales (Chiffre d'affaires et Nombre total de commandes) */}
          <Box sx={{
            mt: 4,
            p: 3,
            bgcolor: '#E65100',
            color: 'white',
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: 3,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            <Box sx={{ minWidth: 200, flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                Chiffre d'Affaires Total
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                {totalRevenue.toFixed(2)} FCFA
              </Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                (Commandes payées ou livrées)
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.5)', display: { xs: 'none', sm: 'block' } }} />

            <Box sx={{ minWidth: 200, flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                Nombre Total de Commandes
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                {totalOrdersCount}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                (Toutes commandes confondues)
              </Typography>
            </Box>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OrderManagement;