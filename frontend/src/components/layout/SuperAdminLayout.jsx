// src/components/layout/SuperAdminLayout.jsx
import React, { useContext } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Launch as LaunchIcon,
  LocalShipping as LocalShippingIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext.jsx";

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isSuperAdmin } = useContext(UserContext);

  // Adjusted to check if the current path *starts* with the given path, for nested routes
  const isActive = (path) => location.pathname.startsWith(path);

  const navButtonStyle = (path) => ({
    color: isActive(path) ? '#FFD700' : '#fff',
    fontWeight: isActive(path) ? 'bold' : 'normal',
    bgcolor: isActive(path) ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
    borderRadius: 1,
    px: 2,
    py: 1,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    display: 'flex',
    alignItems: 'center',
    textTransform: 'none',
    '&:hover': {
      bgcolor: 'rgba(255, 215, 0, 0.3)',
      color: '#fff',
    },
  });

  if (!isSuperAdmin) {
    navigate("/");
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#FDF5E6" }}>
      <AppBar position="sticky" sx={{ bgcolor: "#3E2723", boxShadow: 4 }}>
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Typography
            variant="h6"
            component={Link}
            to="/super-admin" // Points to the SuperAdminDashboard (index element)
            sx={{
              fontWeight: "bold",
              textDecoration: "none",
              color: "#FFD700",
              mr: 4,
            }}
          >
            SUPER ADMIN Lytefood
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button component={Link} to="/super-admin" sx={navButtonStyle("/super-admin/users")}>
              <PeopleIcon sx={{ mr: 1 }} /> Gestion utilisateurs
            </Button>
            <Button component={Link} to="/super-admin/orders" sx={navButtonStyle("/super-admin/orders")}>
              <LocalShippingIcon sx={{ mr: 1 }} /> Gestion commandes
            </Button>
            {/* Le chemin "to" pour FooterSettingsManagementPage est déjà correct */}
            <Button component={Link} to="/super-admin/app_settings" sx={navButtonStyle("/super-admin/app_settings")}>
              <SettingsIcon sx={{ mr: 1 }} /> Gestion des informations
            </Button>
            <Button component={Link} to="/" sx={navButtonStyle("/")}>
              <LaunchIcon sx={{ mr: 1 }} /> Retour site
            </Button>
            <Button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{
                ...navButtonStyle("/login"),
                color: "#E65100",
                "&:hover": { bgcolor: "rgba(230, 81, 0, 0.15)", color: "#FFD700" },
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} /> Déconnexion
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: "center",
          bgcolor: "#3E2723",
          color: "#FFD700",
          mt: "auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Tableau de Bord Super Admin · Lytefood
        </Typography>
      </Box>
    </Box>
  );
};

export default SuperAdminLayout;