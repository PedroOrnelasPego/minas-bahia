import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const active = instance.getActiveAccount();

    if (active) {
      setIsAuthenticated(true);
      setCheckingAuth(false);
    } else if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
      setIsAuthenticated(true);
      setCheckingAuth(false);
    } else {
      setIsAuthenticated(false);
      setCheckingAuth(false);
    }
  }, [accounts, instance]);

  if (checkingAuth) {
    return <p>Verificando autenticação...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/area-graduado/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
