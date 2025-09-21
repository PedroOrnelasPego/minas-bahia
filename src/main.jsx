// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthProvider";

import App from "./App";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

const GOOGLE_CLIENT_ID =
  "682547488468-223fh2c6u5m96ie3hm39cogpfc2di3rk.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
