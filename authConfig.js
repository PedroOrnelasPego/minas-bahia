// src/auth/msalConfig.js
// ✅ volta a usar o redirectUri antigo para ficar igual ao que está no Azure
const redirectUri = window.location.origin + "/area-graduado";

export const msalConfig = {
  auth: {
    clientId: "ad632909-8e39-4a28-b180-19ae2c987a94",
    authority: "https://login.microsoftonline.com/common",
    redirectUri,                  // ← igual ao que já funcionava
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
