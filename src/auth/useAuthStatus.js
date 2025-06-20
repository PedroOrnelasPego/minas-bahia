import { useMsal } from "@azure/msal-react";

export const useAuthStatus = () => {
  const { accounts, instance } = useMsal();

  const activeAccount = instance.getActiveAccount() || accounts[0];

  return {
    isAuthenticated: !!activeAccount,
    account: activeAccount,
    login: () => instance.loginRedirect(),
    logout: () => instance.logoutRedirect(),
  };
};
