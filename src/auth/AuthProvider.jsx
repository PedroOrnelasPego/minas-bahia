// src/auth/AuthProvider.jsx
import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msalInstance";

// rota padrão após login
const DEFAULT_AFTER_LOGIN = "#/acesso-interno";

// aceita somente rotas hash internas do app, ex: "#/x", sem http(s)
function isSafeHashRoute(v) {
  if (typeof v !== "string") return false;
  if (!v.startsWith("#/")) return false;
  // bloqueios básicos contra tentativa de open redirect
  if (v.includes("://") || v.startsWith("#//")) return false;
  return true;
}

export const AuthProvider = ({ children }) => {
  const [msalReady, setMsalReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await msalInstance.initialize();

        // Trata retorno do AAD (login/logout)
        const response = await msalInstance.handleRedirectPromise();

        if (!mounted) return;

        if (response?.account) {
          msalInstance.setActiveAccount(response.account);

          // tenta respeitar o "returnTo" que enviamos no state:
          let target = DEFAULT_AFTER_LOGIN;
          try {
            const parsed = response.state ? JSON.parse(response.state) : null;
            if (parsed?.returnTo && isSafeHashRoute(parsed.returnTo)) {
              target = parsed.returnTo;
            }
          } catch {
            /* ignore state inválido */
          }

          // se o AAD voltou em /acesso-interno (sem hash), normalizamos pro hash
          if (window.location.pathname.startsWith("/acesso-interno")) {
            window.history.replaceState(null, "", "/");
          }

          // navegação final (substitui histórico)
          if (window.location.hash !== target) {
            window.location.replace(target);
          }
        }
      } catch (err) {
        // não logar detalhes sensíveis em produção
        if (import.meta.env.DEV) console.error("Erro MSAL init:", err);
      } finally {
        if (mounted) setMsalReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!msalReady) return <p>Inicializando autenticação…</p>;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
