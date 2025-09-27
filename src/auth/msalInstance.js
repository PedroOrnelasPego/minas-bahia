// src/auth/msalInstance.js
import {
  PublicClientApplication,
  BrowserCacheLocation,
} from "@azure/msal-browser";
import { msalConfig as base } from "../../authConfig";

const cacheLocation =
  (import.meta.env.VITE_MSAL_CACHE || "").toLowerCase() === "localstorage"
    ? BrowserCacheLocation.LocalStorage
    : BrowserCacheLocation.SessionStorage; // mais seguro por padrão

const msalConfig = {
  ...base,
  cache: {
    // usa o que já existir no seu authConfig, mas força opções seguras
    ...(base.cache || {}),
    cacheLocation,
    storeAuthStateInCookie: false,
  },
  system: {
    ...(base.system || {}),
    allowRedirectInIframe: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
