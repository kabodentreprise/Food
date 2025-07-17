// LoginPage.jsx

import React, { useState, useContext } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext.jsx";

// Utilise l'URL du microservice auth depuis le .env
const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL;
const USER_API_URL = process.env.REACT_APP_USER_API_URL;
const MIN_PASSWORD_LENGTH = 8;

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(true);
      setSnackbarMessage(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }
    setPasswordError(false);
    return true;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSnackbarOpen(false);

    if (!validatePassword(password)) {
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // Utilise AUTH_API_URL pour l'authentification
      const response = await axios.post(
        `${AUTH_API_URL}/auth/token`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const accessToken = response.data.access_token;

      // Utilise USER_API_URL pour récupérer les infos utilisateur
      const userDetailsResponse = await axios.get(`${USER_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      login({ ...userDetailsResponse.data, token: accessToken });

      setSnackbarMessage("Connexion réussie !");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        if (userDetailsResponse.data.is_super_admin) {
          navigate("/super-admin");
        } else if (userDetailsResponse.data.is_admin) {
          navigate("/admin");
        } else if (userDetailsResponse.data.is_livreur) {
          navigate("/livreur/dashboard");
        } else {
          navigate("/");
        }
      }, 1000);

    } catch (err) {
      let errorMessage = "Échec de la connexion. Veuillez vérifier vos identifiants.";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        mt: { xs: 6, sm: 8, md: 10 },
        mb: { xs: 4, sm: 6, md: 8 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px - 60px)',
        backgroundColor: '#FDF5E6',
        borderRadius: 3,
        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid #FFD700',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          fontWeight="bold"
          sx={{
            color: "#8B4513",
            mb: 4,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          Bienvenue !
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            label="Adresse Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#FFD700' },
                '&:hover fieldset': { borderColor: '#FFC107' },
                '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' },
              },
            }}
          />
          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={handlePasswordChange}
            required
            variant="outlined"
            error={passwordError}
            helperText={passwordError ? `Doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#FFD700' },
                '&:hover fieldset': { borderColor: '#FFC107' },
                '&.Mui-focused fieldset': { borderColor: '#E65100', borderWidth: '2px' },
              },
              '& .Mui-error .MuiOutlinedInput-notchedOutline': {
                borderColor: 'red !important',
              },
              '& .MuiFormHelperText-root.Mui-error': {
                color: 'red !important',
              },
            }}
          />

          <Typography align="right" sx={{ mt: 1, fontSize: "0.85rem", mb: 2 }}>
            <Link
              to="/forgot-password"
              style={{
                color: "#E65100",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Mot de passe oublié ?
            </Link>
          </Typography>

          <Button
            type="submit"
            variant="contained"
            color="warning"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              borderRadius: 50,
              fontWeight: 'bold',
              boxShadow: '0px 4px 15px rgba(255, 152, 0, 0.4)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)',
                backgroundColor: '#e68a00',
                boxShadow: '0px 6px 20px rgba(255, 152, 0, 0.6)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
          </Button>

          <Typography align="center" sx={{ mt: 3, fontSize: "0.95rem", color: "#616161" }}>
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              style={{
                color: "#E65100",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Créez un compte ici
            </Link>
          </Typography>
        </form>
      </Box>

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
    </Container>
  );
};

export default LoginPage;