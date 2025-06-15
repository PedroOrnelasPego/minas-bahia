export const msalConfig = {
  auth: {
    clientId: "ad632909-8e39-4a28-b180-19ae2c987a94",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173/area-graduado",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
