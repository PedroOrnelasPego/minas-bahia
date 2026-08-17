// src/components/ProtectedRoute/index.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <span className="text-muted">Carregando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/acesso-interno/login" replace />;
  }

  return children;
}
