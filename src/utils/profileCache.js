// src/utils/profileCache.js
const keyFor = (email) => `perfil:${(email || "").toLowerCase()}`;

export const getPerfilCache = (email) => {
  try {
    const raw = sessionStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setPerfilCache = (email, perfil) => {
  if (!email) return;
  sessionStorage.setItem(keyFor(email), JSON.stringify(perfil || {}));
};

export const clearPerfilCache = (email) => {
  if (!email) return;
  sessionStorage.removeItem(keyFor(email));
};
