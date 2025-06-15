// src/index.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "../authConfig";
import App from "./App";

import "./index.css"; // ✅ seu CSS precisa continuar aqui
import "bootstrap/dist/css/bootstrap.min.css";

const msalInstance = new PublicClientApplication(msalConfig);

// Cria o root antes para manter o controle
const root = createRoot(document.getElementById("root"));

msalInstance.initialize().then(() => {
  msalInstance
    .handleRedirectPromise()
    .then((response) => {
      if (response) {
        msalInstance.setActiveAccount(response.account);
        console.log("Login bem-sucedido:", response.account);
        window.location.replace("/area-graduado");
      }
      root.render(
        <StrictMode>
          <MsalProvider instance={msalInstance}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MsalProvider>
        </StrictMode>
      );
    })
    .catch((error) => {
      console.error("Erro no handleRedirectPromise:", error);
    });
});
