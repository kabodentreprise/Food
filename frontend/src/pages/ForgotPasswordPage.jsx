import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

// Utilise l'URL du microservice auth depuis le .env
const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL;

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Étape 1: Demande du code de réinitialisation
  const handleRequestCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${AUTH_API_URL}/auth/forgot-password`, { email });
      setSnackbar({
        open: true,
        message: "Si l'email existe, un code de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception, y compris les spams.",
        severity: "success",
      });
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur lors de l'envoi du code. Veuillez réessayer.";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  // Étape 2: Vérification du code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${AUTH_API_URL}/auth/verify-reset-code`, { email, code });
      setSnackbar({
        open: true,
        message: "Code vérifié avec succès. Vous pouvez maintenant définir votre nouveau mot de passe.",
        severity: "success",
      });
      setStep(3);
    } catch (err) {
      const message = err.response?.data?.detail || "Code invalide ou expiré. Veuillez vérifier et réessayer.";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  // Étape 3: Réinitialisation du mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${AUTH_API_URL}/auth/reset-password`, {
        email,
        code,
        new_password: newPassword,
      });
      setSnackbar({
        open: true,
        message: "Mot de passe réinitialisé avec succès ! Vous allez être redirigé.",
        severity: "success",
      });
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10, mb: 6 }}>
      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "#fff",
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          sx={{ color: "#0D1B2A", mb: 3 }}
        >
          {step === 1 && "Mot de passe oublié"}
          {step === 2 && "Vérification du code"}
          {step === 3 && "Nouveau mot de passe"}
        </Typography>

        <form onSubmit={step === 1 ? handleRequestCode : step === 2 ? handleVerifyCode : handleResetPassword}>
          <TextField
            label="Adresse Email"
            type="email"
            fullWidth
            required
            value={email}
            disabled={step !== 1}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            InputLabelProps={{ style: { color: "#7B5E57" } }}
          />

          {step >= 2 && (
            <TextField
              label="Code reçu par mail"
              fullWidth
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              margin="normal"
              InputLabelProps={{ style: { color: "#7B5E57" } }}
              disabled={step === 3}
            />
          )}

          {step === 3 && (
            <>
              <TextField
                label="Nouveau mot de passe"
                type="password"
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                InputLabelProps={{ style: { color: "#7B5E57" } }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Votre mot de passe doit contenir au moins 8 caractères.
              </Typography>
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              borderRadius: 50,
              fontWeight: "bold",
              bgcolor: "#0D1B2A",
              ":hover": { bgcolor: "#142b46" },
            }}
          >
            {step === 1 && "Envoyer le code"}
            {step === 2 && "Vérifier le code"}
            {step === 3 && "Réinitialiser"}
          </Button>
        </form>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgotPassword;