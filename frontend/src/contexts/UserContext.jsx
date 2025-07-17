// D:\FIN\frontend\src\contexts\UserContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios'; // Non nécessaire si vous ne validez pas le token au démarrage ici

export const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // const [token, setToken] = useState(null); // Pas besoin d'un état 'token' séparé si user.token suffit
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLivreur, setIsLivreur] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserString = localStorage.getItem('user');

      if (storedToken && storedUserString) {
        const storedUser = JSON.parse(storedUserString);

        // setToken(storedToken); // Cette ligne peut être supprimée
        // Important: Reconstruire l'objet user avec le token pour qu'il soit toujours disponible
        // via user.token dans les composants qui utilisent le contexte.
        setUser({ ...storedUser, token: storedToken });
        setIsAdmin(storedUser.is_admin || false);
        setIsSuperAdmin(storedUser.is_super_admin || false);
        setIsLivreur(storedUser.is_livreur || false);
      }
    } catch (error) {
      console.error("Erreur lors de la lecture ou du parsing du localStorage:", error);
      localStorage.clear();
      setUser(null);
      // setToken(null); // Cette ligne peut être supprimée
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsLivreur(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    // userData contient déjà access_token sous la clé 'token' grâce à LoginPage.jsx
    // qui fait login({ ...userDetailsResponse.data, token: accessToken });
    setUser(userData);
    setIsAdmin(userData.is_admin || false);
    setIsSuperAdmin(userData.is_super_admin || false);
    setIsLivreur(userData.is_livreur || false);

    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    // setToken(null); // Cette ligne peut être supprimée
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsLivreur(false);
    localStorage.clear();
    navigate('/login');
  };

  const contextValue = {
    user,
    setUser,
    token: user?.token, // Accéder au token via user.token
    isAdmin,
    isSuperAdmin,
    isLivreur,
    isAuthenticated: !!user?.token, // Vérifie si user.token existe
    loading,
    login,
    logout,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;