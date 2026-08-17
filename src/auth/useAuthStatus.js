// src/auth/useAuthStatus.js
import { useAuth } from "./AuthProvider";

export const useAuthStatus = () => {
  return useAuth();
};
