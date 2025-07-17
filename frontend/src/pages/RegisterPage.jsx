import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL;
const MIN_PASSWORD_LENGTH = 8;

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [passwordError, setPasswordError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const navigate = useNavigate();

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
    setPasswordError(newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmError(value !== password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSnackbarOpen(false);

    if (!validatePassword(password)) return;
    if (password !== confirmPassword) {
      setConfirmError(true);
      setSnackbarMessage("Les mots de passe ne correspondent pas.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const registrationData = {
        email,
        password,
      };

      await axios.post(`${AUTH_API_URL}/auth/register`, registrationData);

      setSnackbarMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      let errorMessage = "Erreur lors de l'inscription. Veuillez réessayer.";
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
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
          Créez votre compte
        </Typography>

        <form onSubmit={handleRegister}>
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
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            variant="outlined"
            error={confirmError}
            helperText={confirmError ? "Les mots de passe ne correspondent pas." : ''}
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

          <Button
            type="submit"
            variant="contained"
            color="warning"
            fullWidth
            size="large"
            sx={{
              mt: 3,
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
            S'inscrire
          </Button>

          <Typography align="center" sx={{ mt: 3, fontSize: "0.95rem", color: "#616161" }}>
            Vous avez déjà un compte ?{" "}
            <Link
              to="/login"
              style={{
                color: "#E65100",
                textDecoration: "none",
                fontWeight: "bold",
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Connectez-vous ici
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

export default RegisterPage;