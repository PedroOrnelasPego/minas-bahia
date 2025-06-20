import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msalInstance";

export const AuthProvider = ({ children }) => {
  const [msalReady, setMsalReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await msalInstance.initialize();

        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          msalInstance.setActiveAccount(response.account);
          window.location.replace("/area-graduado");
          return; // evita continuar render se redirecionou
        }

        setMsalReady(true); // ✅ só ativa render quando tudo OK
      } catch (error) {
        console.error("Erro na inicialização do MSAL:", error);
      }
    };

    initAuth();
  }, []);

  if (!msalReady) {
    return <p>Inicializando autenticação...</p>; // ou um loading bonitinho
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
