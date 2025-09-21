// src/auth/session.js

import { msalInstance } from "../auth/msalInstance";

/**
 * Chave usada para marcar sessão Google após /auth/google.
 * Valor: string com email.
 */
const GOOGLE_KEY = "app_google_email";

/** Retorna o email autenticado (MSAL OU Google) */
export function getAuthEmail() {
  // 1) MSAL (Microsoft)
  const active = msalInstance.getActiveAccount();
  const msalAccount = active || (msalInstance.getAllAccounts?.()[0] ?? null);
  if (msalAccount?.username) return msalAccount.username;

  // 2) Google (persistido no localStorage após /auth/google)
  const g = localStorage.getItem(GOOGLE_KEY);
  if (g && typeof g === "string" && g.includes("@")) return g;

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
  if (msalAccount?.username) return "microsoft";
  if (localStorage.getItem(GOOGLE_KEY)) return "google";
  return null;
}

/** usada no Login do Google, após sucesso do backend */
export function setGoogleSession(email) {
  if (email) localStorage.setItem(GOOGLE_KEY, email);
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
    // volta para a tela de login
    window.location.replace("/area-graduado/login");
    return;
  }

  // fallback
  window.location.replace("/area-graduado/login");
}
