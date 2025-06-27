const redirectUri = window.location.origin + "/area-graduado";

export const msalConfig = {
  auth: {
    clientId: "ad632909-8e39-4a28-b180-19ae2c987a94",
    authority: "https://login.microsoftonline.com/common",
    redirectUri, // usa a origem atual dinamicamente
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
