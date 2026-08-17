// src/auth/session.js
import { msalInstance } from "../auth/msalInstance";

const GOOGLE_KEY = "app_google_email";
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
  const active = msalInstance.getActiveAccount?.();
  const msalEmail = cleanEmail(active?.username);
  if (msalEmail) return msalEmail;

  const g = cleanEmail(STORE.getItem(GOOGLE_KEY));
  if (g) return g;

  return null;
}

export function isAuthenticated() {
  return !!getAuthEmail();
}

export function getAuthProvider() {
  const active = msalInstance.getActiveAccount?.();
  if (cleanEmail(active?.username)) return "microsoft";
  if (cleanEmail(STORE.getItem(GOOGLE_KEY))) return "google";
  return null;
}

export function setGoogleSession(email) {
  const e = cleanEmail(email);
  if (e) {
    STORE.setItem(GOOGLE_KEY, e);
    try {
      window.dispatchEvent(new CustomEvent("authChanged", { detail: { email: e, provider: "google" } }));
    } catch {
      /* ignore */
    }
  }
}

export function clearHints() {
  STORE.removeItem(GOOGLE_KEY);

  // Limpa conta ativa do MSAL
  try {
    msalInstance.setActiveAccount(null);
  } catch {
    /* ignore */
  }

  // Limpa chaves do MSAL no sessionStorage e localStorage
  try {
    const clearStorageKeys = (storage) => {
      if (!storage) return;
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (
          key &&
          (key.startsWith("msal.") ||
            key.includes("login.windows.net") ||
            key.includes("login.microsoftonline.com") ||
            key === GOOGLE_KEY)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    };

    clearStorageKeys(window.sessionStorage);
    clearStorageKeys(window.localStorage);
  } catch {
    /* ignore */
  }

  try {
    window.dispatchEvent(new CustomEvent("authChanged", { detail: { email: null, provider: null } }));
  } catch {
    /* ignore */
  }
}

export async function signOutUnified() {
  clearHints();

  try {
    if (typeof msalInstance.clearCache === "function") {
      await msalInstance.clearCache();
    }
  } catch {
    /* ignore */
  }

  const loginHash = "#/acesso-interno/login";
  if (window.location.hash !== loginHash) {
    window.location.hash = loginHash;
  }
}
