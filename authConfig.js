// src/auth/msalConfig.js

// Lê configs do ambiente (não commitar valores fixos)
const ENV_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID; // obrigatória via .env/.CI
const ENV_AUTHORITY =
  import.meta.env.VITE_MSAL_AUTHORITY ||
  "https://login.microsoftonline.com/common";
const ENV_CACHE = (
  import.meta.env.VITE_MSAL_CACHE || "sessionstorage"
).toLowerCase(); // sessionstorage (recomendado) | localstorage
const ENV_SCOPES = (import.meta.env.VITE_MSAL_SCOPES || "User.Read")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Evita crash em SSR (se algum dia trocar o bundler)
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

// Mantemos teu fluxo: AAD redireciona para /acesso-interno (sem hash).
// O AuthProvider normaliza para hash (#/acesso-interno) depois.
const redirectUri = `${ORIGIN}/acesso-interno`;
const postLogoutRedirectUri = `${ORIGIN}/#/acesso-interno/login`;

// Mapeia cacheLocation de forma segura
const BrowserCacheLocation = {
  localstorage: "localStorage",
  sessionstorage: "sessionStorage",
};
const cacheLocation =
  BrowserCacheLocation[ENV_CACHE] || BrowserCacheLocation.sessionstorage;

export const msalConfig = {
  auth: {
    clientId: ENV_CLIENT_ID, // <- defina VITE_MSAL_CLIENT_ID no .env/.CI
    authority: ENV_AUTHORITY,
    redirectUri,
    postLogoutRedirectUri,
    // Deixamos o controle de navegação para o AuthProvider (evita loops)
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation, // sessionStorage por padrão (mais seguro)
    storeAuthStateInCookie: false, // true só se precisar suportar IE/edge-legacy
  },
  system: {
    allowRedirectInIframe: false, // evita login dentro de iframes
  },
};

// Scopes de login (configuráveis por env)
export const loginRequest = {
  scopes: ENV_SCOPES,
};
