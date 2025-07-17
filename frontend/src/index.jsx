import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Importation de BrowserRouter ici
import App from './App.jsx';
import UserProvider from './contexts/UserContext.jsx'; // Vérifiez que ce chemin est correct

// Assurez-vous que votre fichier CSS existe à ce chemin
import './Styles/colors.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* BrowserRouter doit envelopper toute l'application pour le routage */}
    <BrowserRouter>
      {/* UserProvider doit envelopper App pour fournir le contexte utilisateur */}
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
