import { msalInstance } from "../auth/msalInstance";

const GOOGLE_KEY = "app_google_email";

function cleanEmail(v) {
  if (!v) return null;
  const s = String(v)
    .trim()
    .replace(/^"+|"+$/g, "")
    .toLowerCase();
  return s.includes("@") ? s : null;
}

/** Retorna o email autenticado (MSAL OU Google) */
export function getAuthEmail() {
  // 1) Microsoft (MSAL)
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  const msalEmail = cleanEmail(msalAccount?.username);
  if (msalEmail) return msalEmail;

  // 2) Google (persistido no localStorage após /auth/google)
  const g = cleanEmail(localStorage.getItem(GOOGLE_KEY));
  if (g) return g;

  return null;
}

/** true se existe email autenticado por qualquer provedor */
export function isAuthenticated() {
  return !!getAuthEmail();
}

/** "microsoft" | "google" | null */
export function getAuthProvider() {
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  if (cleanEmail(msalAccount?.username)) return "microsoft";
  if (cleanEmail(localStorage.getItem(GOOGLE_KEY))) return "google";
  return null;
}

/** usada no Login do Google, após sucesso do backend */
export function setGoogleSession(email) {
  const e = cleanEmail(email);
  if (e) localStorage.setItem(GOOGLE_KEY, e);
}

/** Logout unificado */
export async function signOutUnified() {
  const provider = getAuthProvider();

  if (provider === "microsoft") {
    await msalInstance.logoutRedirect();
    return;
  }

  if (provider === "google") {
    localStorage.removeItem(GOOGLE_KEY);
    window.location.replace("/area-graduado/login");
    return;
  }

  window.location.replace("/area-graduado/login");
}
