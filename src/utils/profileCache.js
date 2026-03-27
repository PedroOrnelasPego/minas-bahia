// src/utils/profileCache.js
const keyFor = (email) => `perfil:${(email || "").toLowerCase()}`;

export const getPerfilCache = (email) => {
  try {
    const raw = localStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setPerfilCache = (email, perfil) => {
  if (!email) return;
  localStorage.setItem(keyFor(email), JSON.stringify(perfil || {}));
  window.dispatchEvent(new CustomEvent("profileUpdated"));
};

export const clearPerfilCache = (email) => {
  if (!email) return;
  localStorage.removeItem(keyFor(email));
  window.dispatchEvent(new CustomEvent("profileUpdated"));
};
