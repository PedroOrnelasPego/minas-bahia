// src/auth/useAuthStatus.js
import { useMsal } from "@azure/msal-react";

const LOGIN_REDIRECT = `${window.location.origin}/#/area-graduado`;
const LOGOUT_REDIRECT = `${window.location.origin}/#/area-graduado/login`;

export const useAuthStatus = () => {
  const { accounts, instance } = useMsal();
  const activeAccount = instance.getActiveAccount() || accounts?.[0] || null;

  const login = () => {
    const returnTo = window.location.hash || "#/";
    return instance.loginRedirect({
      redirectUri: LOGIN_REDIRECT,
      // scopes opcionais aqui, ex.: scopes: ["User.Read"]
      state: JSON.stringify({ returnTo }), // lido no AuthProvider
    });
  };

  const logout = () =>
    instance.logoutRedirect({
      postLogoutRedirectUri: LOGOUT_REDIRECT,
    });

  return {
    isAuthenticated: !!activeAccount,
    account: activeAccount,
    login,
    logout,
  };
};
