// src/auth/AuthProvider.jsx
import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msalInstance";

export const AuthProvider = ({ children }) => {
  const [msalReady, setMsalReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await msalInstance.initialize();

        // Trata o retorno do login Microsoft (redirectUri aponta para /area-graduado)
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          msalInstance.setActiveAccount(response.account);

          // ✅ Limpamos o PATH que veio do redirectUri (/area-graduado)
          // para que o site não fique "preso" nesse prefixo no endereço:
          if (window.location.pathname.startsWith("/area-graduado")) {
            // remove o path e mantém a mesma página base
            window.history.replaceState(null, "", "/");
          }

          // ✅ Agora navegamos via hash (HashRouter)
          if (window.location.hash !== "#/area-graduado") {
            window.location.hash = "#/area-graduado";
          }
        }

        setMsalReady(true);
      } catch (error) {
        console.error("Erro na inicialização do MSAL:", error);
        setMsalReady(true);
      }
    };

    initAuth();
  }, []);

  if (!msalReady) return <p>Inicializando autenticação...</p>;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
