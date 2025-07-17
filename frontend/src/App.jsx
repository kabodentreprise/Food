// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import ClientLayout from "./components/layout/ClientLayout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import SuperAdminLayout from "./components/layout/SuperAdminLayout.jsx";
import LivreurLayout from "./components/layout/LivreurLayout.jsx"; // NOUVEAU: Import du layout Livreur

// Routes protégées
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./components/Auth/ProtectedAdminRoute.jsx";
import ProtectedSuperAdminRoute from "./components/Auth/ProtectedSuperAdminRoute.jsx";
import ProtectedLivreurRoute from "./components/Auth/ProtectedLivreurRoute.jsx"; // NOUVEAU: Import de la route protégée Livreur

// Pages client
import HomePage from "./pages/HomePage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import AboutPage from './pages/AboutPage';
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import TrackOrderPage from "./pages/TrackOrderPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AppSettingsManagementPage from "./pages/AppSettingsManagementPage.jsx";

// Pages admin
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MenuManagement from "./pages/MenuManagement.jsx";
import CategoryManagement from "./pages/CategoryManagement.jsx";
import OrderManagement from "./pages/OrderManagement.jsx";
import AdminOrdersPage from './pages/AdminOrdersPage';

// Pages super-admin
import UserManagementPage from "./pages/UserManagementPage.jsx";

// NOUVEAU: Page Livreur
import LivreurDashboard from "./pages/LivreurDashboard.jsx";

function App() {
  return (
    <Routes>
      {/* Interface client (Layout client) */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menus" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Pages protégées pour les utilisateurs connectés (clients ou autres rôles non spécifiques) */}
        <Route element={<ProtectedRoute />}>
          {/* Note: ProfilePage est ici aussi car elle peut être accédée par tout utilisateur connecté */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-history" element={<OrderHistoryPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          {/* Possibilité future : /orders/:id */}
        </Route>
      </Route>

      {/* Interface admin protégée (Layout admin) */}
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        {/* Les routes ici seront rendues dans l'<Outlet /> d'AdminLayout */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/menus" element={<MenuManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/my-orders" element={<AdminOrdersPage />} /> 
        {/* À venir : /admin/statistiques, /admin/utilisateurs */}
      </Route>

      {/* Interface super-admin protégée (Layout super-admin) */}
      <Route
        element={
          <ProtectedSuperAdminRoute>
            <SuperAdminLayout />
          </ProtectedSuperAdminRoute>
        }
      >
        {/* Les routes ici seront rendues dans l'<Outlet /> de SuperAdminLayout */}
        <Route path="/super-admin" element={<UserManagementPage />} />
        <Route path="/super-admin/app_settings" element={<AppSettingsManagementPage />} />
        <Route path="/super-admin/orders" element={<OrderManagement />} />
      </Route>

      {/* NOUVEAU: Interface livreur protégée (Layout livreur) */}
      <Route
        element={
          <ProtectedLivreurRoute> {/* Utilise le nouveau composant ProtectedLivreurRoute */}
            <LivreurLayout /> {/* Utilise le nouveau LivreurLayout */}
          </ProtectedLivreurRoute>
        }
      >
        {/* La route pour le tableau de bord du livreur sera rendue dans l'<Outlet /> de LivreurLayout */}
        <Route path="/livreur" element={<LivreurDashboard />} />
        {/* Si vous avez d'autres sous-pages spécifiques au livreur, elles iraient ici */}
      </Route>

      {/* Route de redirection par défaut pour les chemins inconnus */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;