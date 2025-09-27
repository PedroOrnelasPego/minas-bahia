// src/auth/session.js
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

export function getAuthEmail() {
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  const msalEmail = cleanEmail(msalAccount?.username);
  if (msalEmail) return msalEmail;

  const g = cleanEmail(sessionStorage.getItem(GOOGLE_KEY));
  if (g) return g;

  return null;
}

export function isAuthenticated() {
  return !!getAuthEmail();
}

export function getAuthProvider() {
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  if (cleanEmail(msalAccount?.username)) return "microsoft";
  if (cleanEmail(sessionStorage.getItem(GOOGLE_KEY))) return "google";
  return null;
}

export function setGoogleSession(email) {
  const e = cleanEmail(email);
  if (e) sessionStorage.setItem(GOOGLE_KEY, e);
}

export async function signOutUnified() {
  const provider = getAuthProvider();

  if (provider === "microsoft") {
    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin, // volta para origem
    });
    // Ao voltar, deixamos o usuário na tela de login via hash:
    window.location.hash = "#/area-graduado/login";
    return;
  }

  if (provider === "google") {
    sessionStorage.removeItem(GOOGLE_KEY);
    window.location.hash = "#/area-graduado/login";
    return;
  }

  window.location.hash = "#/area-graduado/login";
}
