// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient"; // ajuste o caminho conforme necessário

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Busca a sessão atual no Supabase (pode ser do localStorage)
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();
  }, []);

  if (loading) {
    // Enquanto verifica a autenticação, mostra um loading ou spinner
    return <div>Loading...</div>;
  }

  if (!session) {
    // Se não houver sessão, redireciona para a página de erro
    return <Navigate to="/notfound" replace />;
  }

  // Se autenticado, renderiza os elementos protegidos
  return children;
};

export default ProtectedRoute;
