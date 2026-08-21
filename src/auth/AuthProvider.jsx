// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msalInstance";
import {
  getAuthEmail,
  getAuthProvider,
  setGoogleSession,
  clearHints,
  signOutUnified,
  isAuthenticated,
} from "./session";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

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
  const [authEmail, setAuthEmail] = useState(() => getAuthEmail());
  const [authProvider, setAuthProvider] = useState(() => getAuthProvider());

  const refreshAuth = useCallback(() => {
    setAuthEmail(getAuthEmail());
    setAuthProvider(getAuthProvider());
  }, []);

  useEffect(() => {
    let mounted = true;

    // Escuta eventos customizados de mudança de autenticação (ex: login/logout do Google)
    const handleAuthChanged = () => {
      if (mounted) refreshAuth();
    };
    window.addEventListener("authChanged", handleAuthChanged);

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
        } else if (!msalInstance.getActiveAccount()) {
          const allAccounts = msalInstance.getAllAccounts?.() || [];
          if (allAccounts.length > 0) {
            msalInstance.setActiveAccount(allAccounts[0]);
          }
        }

        // Sincronizar sessão do Microsoft com o Backend
        const activeAccount = msalInstance.getActiveAccount();
        if (activeAccount) {
          let accessToken = response?.accessToken;
          if (!accessToken) {
            try {
              const silent = await msalInstance.acquireTokenSilent({
                scopes: ["User.Read"],
                account: activeAccount,
              });
              accessToken = silent.accessToken;
            } catch (e) {
              /* ignore */
            }
          }
          if (accessToken) {
            try {
              const apiRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/microsoft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken }),
              });
              if (apiRes.ok) {
                const data = await apiRes.json();
                if (data?.token) {
                  localStorage.setItem("access_token", data.token);
                }
              }
            } catch (err) {
              console.error("Erro ao sincronizar sessão Microsoft com backend:", err);
            }
          }
        }

        refreshAuth();
      } catch (err) {
        // não logar detalhes sensíveis em produção
        if (import.meta.env.DEV) console.error("Erro MSAL init:", err);
      } finally {
        if (mounted) {
          setMsalReady(true);
          refreshAuth();
        }
      }
    })();

    return () => {
      mounted = false;
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, [refreshAuth]);

  const loginGoogle = useCallback(
    (email) => {
      setGoogleSession(email);
      refreshAuth();
    },
    [refreshAuth]
  );

  const logout = useCallback(async () => {
    clearHints();
    refreshAuth();
    await signOutUnified();
  }, [refreshAuth]);

  const value = {
    email: authEmail,
    provider: authProvider,
    isAuthenticated: isAuthenticated(),
    loading: !msalReady,
    loginGoogle,
    logout,
    refreshAuth,
  };

  if (!msalReady) return <p className="text-center p-4">Inicializando autenticação…</p>;

  return (
    <MsalProvider instance={msalInstance}>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </MsalProvider>
  );
};
