// src/pages/AreaGraduado/Login/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../../auth/AuthProvider";
import { Alert, Spinner } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const { instance } = useMsal();
  const { loginGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Se o usuário já estiver autenticado, redireciona suavemente para /acesso-interno
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/acesso-interno", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleMicrosoftLogin = async () => {
    try {
      setErrorMessage("");
      await instance.loginRedirect({
        redirectStartPage: window.location.href,
      });
    } catch (error) {
      console.error("Erro ao logar com Microsoft:", error);
      setErrorMessage("Falha ao entrar com Microsoft");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setErrorMessage("");
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
      loginGoogle(email);

      // Redirecionamento reativo imediato via React Router
      navigate("/acesso-interno", { replace: true });
    } catch (e) {
      console.error("Erro no login Google:", e);
      setErrorMessage(e.message || "Falha ao entrar com Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage("Falha na comunicação com o Google");
  };

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

                {errorMessage && (
                  <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
                    {errorMessage}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" role="status" className="mb-2" />
                    <p className="text-muted small">Autenticando...</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
