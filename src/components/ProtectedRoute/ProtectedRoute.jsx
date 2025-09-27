// src/components/ProtectedRoute/index.jsx
import { Navigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { isAuthenticated } from "../../auth/session";

export default function ProtectedRoute({ children }) {
  const { inProgress } = useMsal(); // "none", "login", "acquireToken", etc.

  // Enquanto o MSAL está iniciando/interagindo, ainda não decidimos nada.
  if (inProgress && inProgress !== "none") {
    return null; // ou um <div>Carregando...</div> se quiser
  }

  // Usa seu mecanismo atual de sessão (Google/MSAL via AuthProvider)
  if (!isAuthenticated()) {
    return <Navigate to="/area-graduado/login" replace />;
  }

  return children;
}
