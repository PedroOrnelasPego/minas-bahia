// src/components/ProtectedRoute/index.jsx
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../auth/session";

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/area-graduado/login" replace />;
  return children;
}
