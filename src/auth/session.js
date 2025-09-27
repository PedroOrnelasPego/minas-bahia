// src/auth/session.js
import { msalInstance } from "../auth/msalInstance";

const GOOGLE_KEY = "app_google_email";
// usar sessionStorage reduz persistência; troque para localStorage se quiser "lembrar"
const STORE = window.localStorage;

function cleanEmail(v) {
  if (!v) return null;
  const s = String(v)
    .trim()
    .replace(/^"+|"+$/g, "")
    .toLowerCase();
  return s.includes("@") ? s : null;
}

export function getAuthEmail() {
  // ⚠️ apenas hint de sessão (front). Backend deve validar tokens sempre.
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  const msalEmail = cleanEmail(msalAccount?.username);
  if (msalEmail) return msalEmail;

  const g = cleanEmail(STORE.getItem(GOOGLE_KEY));
  if (g) return g;

  return null;
}

export function isAuthenticated() {
  // ⚠️ NÃO use isto para autorização de servidor. Só UX no front.
  return !!getAuthEmail();
}

export function getAuthProvider() {
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  if (cleanEmail(msalAccount?.username)) return "microsoft";
  if (cleanEmail(STORE.getItem(GOOGLE_KEY))) return "google";
  return null;
}

export function setGoogleSession(email) {
  const e = cleanEmail(email);
  if (e) STORE.setItem(GOOGLE_KEY, e);
}

export function clearHints() {
  STORE.removeItem(GOOGLE_KEY);
}

export async function signOutUnified() {
  const provider = getAuthProvider();

  const loginHash = "#/area-graduado/login";
  const postLogout = `${window.location.origin}/${loginHash}`;

  if (provider === "microsoft") {
    clearHints();
    // volta direto para a tela de login (hash incluso)
    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: postLogout,
    });
    return; // a navegação acontece via redirect acima
  }

  if (provider === "google") {
    clearHints();
    // substitui histórico para evitar "voltar" cair em telas protegidas
    window.location.replace(loginHash);
    return;
  }

  window.location.replace(loginHash);
}
