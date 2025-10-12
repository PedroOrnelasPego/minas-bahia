// src/pages/AreaGraduado/Login/Login.jsx
import { useMsal } from "@azure/msal-react";
import { GoogleLogin } from "@react-oauth/google";
import { setGoogleSession } from "../../../auth/session";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    try {
      // Ao retornar, AuthProvider faz a limpeza do path e manda para #/acesso-interno
      await instance.loginRedirect({
        redirectStartPage: window.location.href,
      });
    } catch (error) {
      console.error("Erro ao logar com Microsoft:", error);
      alert("Falha ao entrar com Microsoft");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;

      const r = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.erro || "Falha ao autenticar");
      }

      const { email } = await r.json();
      setGoogleSession(email);

      // HashRouter: vai direto para a área via hash
      window.location.hash = "#/acesso-interno";
    } catch (e) {
      console.error(e);
      alert("Falha ao entrar com Google");
    }
  };

  const handleGoogleError = () => alert("Falha no login do Google");

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "60vh" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                <h2 className="h3 text-center mb-4">Login</h2>

                <div className="d-flex justify-content-center w-100">
                  <div className="w-100">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      width="100%"
                    />
                  </div>
                </div>

                <div className="text-center text-muted my-2">ou</div>

                <div className="d-flex justify-content-center w-100">
                  <button
                    onClick={handleMicrosoftLogin}
                    className="btn btn-primary w-100"
                  >
                    Fazer Login com a Microsoft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
