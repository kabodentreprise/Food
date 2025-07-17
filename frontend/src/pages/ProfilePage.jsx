import React, { useState, useEffect, useContext } from "react";
import {
    Container,
    Typography,
    Box,
    Button,
    TextField,
    Paper,
    CircularProgress,
    Snackbar,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

// Utilise l'URL du microservice user depuis le .env
const USER_API_URL = process.env.REACT_APP_USER_API_URL;

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ProfilePage = () => {
    const { user, login } = useContext(UserContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        delivery_address: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    useEffect(() => {
        if (!user || !user.token) {
            navigate("/login");
            return;
        }
        setProfileData({
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            phone_number: user.phone_number || "",
            delivery_address: user.delivery_address || "",
        });
        setLoading(false);
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'phone_number') {
            if (newValue.startsWith('+')) {
                newValue = '+' + newValue.slice(1).replace(/\D/g, '');
            } else {
                newValue = newValue.replace(/\D/g, '');
            }
        }
        setProfileData((prevData) => ({
            ...prevData,
            [name]: newValue,
        }));
        setFieldErrors((prevErrors) => ({
            ...prevErrors,
            [name]: undefined,
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSnackbarOpen(false);
        setFieldErrors({});
        if (!user || !user.token) {
            showSnackbar("Vous devez être connecté pour modifier votre profil.", "error");
            setLoading(false);
            navigate("/login");
            return;
        }
        try {
            const response = await axios.put(`${USER_API_URL}/users/me`, profileData, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
            });
            login({ ...response.data, token: user.token });
            setEditing(false);
            showSnackbar("Profil mis à jour avec succès !", "success");
        } catch (err) {
            let errorMessage = "Erreur lors de la mise à jour du profil. Veuillez réessayer.";
            const newFieldErrors = {};
            if (err.response) {
                if (err.response.status === 422 && Array.isArray(err.response.data.detail)) {
                    const validationErrors = err.response.data.detail.map(errorDetail => {
                        const cleanMsg = errorDetail.msg.replace(/^Value error, /, '');
                        const fieldName = errorDetail.loc.length > 1 ? errorDetail.loc[errorDetail.loc.length - 1] : null;
                        if (fieldName) {
                            newFieldErrors[fieldName] = cleanMsg;
                        }
                        return cleanMsg;
                    });
                    if (Object.keys(newFieldErrors).length > 0) {
                        setFieldErrors(newFieldErrors);
                        errorMessage = "Veuillez corriger les erreurs dans le formulaire.";
                    } else {
                        errorMessage = "Problème(s) de validation :\n" + validationErrors.join("\n");
                    }
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else {
                    errorMessage = `Erreur: ${err.response.status}`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    if (loading || !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
                <CircularProgress size={60} sx={{ color: '#E65100' }} />
                <Typography variant="h6" sx={{ mt: 3, color: '#8B4513' }}>
                    Chargement du profil...
                </Typography>
            </Box>
        );
    }

    return (
        <Container sx={{ mt: 6, mb: 8, backgroundColor: '#FDF5E6', borderRadius: 3, p: { xs: 2, md: 5 }, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)' }}>
            <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight="bold"
                align="center"
                sx={{
                    color: "#8B4513",
                    mb: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    pb: 1.5,
                    borderBottom: '5px solid #FFD700',
                    display: 'inline-block',
                    mx: 'auto',
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                }}
            >
                Mon Compte
            </Typography>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: '#FFFFFF', border: '1px solid #FFD700' }}>
                {editing ? (
                    <form onSubmit={handleUpdateProfile}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", mb: 3 }}>
                            Modifier mes informations
                        </Typography>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            fullWidth
                            margin="normal"
                            value={profileData.email}
                            onChange={handleChange}
                            required
                            disabled
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root.Mui-disabled': { '& fieldset': { borderColor: '#E0E0E0' } } }}
                        />
                        <TextField
                            label="Prénom"
                            name="first_name"
                            fullWidth
                            margin="normal"
                            value={profileData.first_name}
                            onChange={handleChange}
                            variant="outlined"
                            error={!!fieldErrors.first_name}
                            helperText={fieldErrors.first_name}
                        />
                        <TextField
                            label="Nom de famille"
                            name="last_name"
                            fullWidth
                            margin="normal"
                            value={profileData.last_name}
                            onChange={handleChange}
                            variant="outlined"
                            error={!!fieldErrors.last_name}
                            helperText={fieldErrors.last_name}
                        />
                        <TextField
                            label="Numéro de téléphone"
                            name="phone_number"
                            type="tel"
                            fullWidth
                            margin="normal"
                            value={profileData.phone_number}
                            onChange={handleChange}
                            variant="outlined"
                            error={!!fieldErrors.phone_number}
                            helperText={fieldErrors.phone_number}
                            inputProps={{
                                pattern: "^\\+?\\d*$",
                                maxLength: 20
                            }}
                        />
                        <TextField
                            label="Adresse de livraison"
                            name="delivery_address"
                            fullWidth
                            margin="normal"
                            value={profileData.delivery_address}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            variant="outlined"
                            error={!!fieldErrors.delivery_address}
                            helperText={fieldErrors.delivery_address}
                        />
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                    setEditing(false);
                                    setFieldErrors({});
                                    setProfileData({
                                        email: user.email || "",
                                        first_name: user.first_name || "",
                                        last_name: user.last_name || "",
                                        phone_number: user.phone_number || "",
                                        delivery_address: user.delivery_address || "",
                                    });
                                }}
                                disabled={loading}
                                sx={{ borderRadius: 50, fontWeight: 'bold' }}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="warning"
                                disabled={loading}
                                sx={{ borderRadius: 50, fontWeight: 'bold' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Enregistrer les modifications"}
                            </Button>
                        </Box>
                    </form>
                ) : (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#8B4513", mb: 3 }}>
                            Mes informations personnelles
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Typography component="span" fontWeight="bold">Email :</Typography> {user.email}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Typography component="span" fontWeight="bold">Prénom :</Typography> {user.first_name || "Non spécifié"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Typography component="span" fontWeight="bold">Nom de famille :</Typography> {user.last_name || "Non spécifié"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Typography component="span" fontWeight="bold">Téléphone :</Typography> {user.phone_number || "Non spécifié"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            <Typography component="span" fontWeight="bold">Adresse de livraison :</Typography> {user.delivery_address || "Non spécifiée"}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={() => setEditing(true)}
                                sx={{ borderRadius: 50, fontWeight: 'bold' }}
                            >
                                Modifier le profil
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', whiteSpace: 'pre-line' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProfilePage;