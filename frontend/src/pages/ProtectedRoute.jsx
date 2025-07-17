import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default ProtectedRoute;