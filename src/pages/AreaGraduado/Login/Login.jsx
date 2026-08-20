// src/pages/AreaGraduado/Login/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../../auth/AuthProvider";
import { Alert, Spinner } from "react-bootstrap";
import logoMbc from "../../../assets/logo/logoMbc.png";

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
    <div className="d-flex align-items-center justify-content-center py-5 px-3" style={{ minHeight: "70vh" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div
              className="card border-0 rounded-4"
              style={{
                borderTop: "5px solid #8b0000",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.15)",
                backgroundColor: "#ffffff",
              }}
            >
              <div className="card-body p-4 p-sm-5 text-center">
                <h1 className="h4 fw-bold text-dark mb-2">Acesso Interno</h1>

                {/* Explicação breve para o usuário */}
                <p className="text-muted small mb-4" style={{ lineHeight: "1.5" }}>
                  Portal exclusivo para integrantes do <strong>ICMBC</strong>.
                </p>

                {errorMessage && (
                  <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible className="text-start small">
                    {errorMessage}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="danger" role="status" className="mb-2" />
                    <p className="text-muted small mb-0">Autenticando sua conta...</p>
                  </div>
                ) : (
                  <>
                    {/* Botão Google Login */}
                    <div className="d-flex justify-content-center w-100 mb-3">
                      <div className="w-100">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          width="100%"
                          theme="outline"
                          size="large"
                          shape="pill"
                          text="signin_with"
                          locale="pt-BR"
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center my-3">
                      <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                      <span className="px-3 text-muted small fw-semibold">ou</span>
                      <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                    </div>

                    {/* Botão Microsoft Login */}
                    <div className="d-flex justify-content-center w-100">
                      <button
                        onClick={handleMicrosoftLogin}
                        className="btn-oauth-custom"
                        type="button"
                      >
                        <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                        </svg>
                        <span>Fazer Login com a Microsoft</span>
                      </button>
                    </div>

                    {/* Nota Informativa para novos integrantes */}
                    <div className="mt-4 pt-3 border-top text-center">
                      <p className="mb-0 text-muted" style={{ fontSize: "0.82rem", lineHeight: "1.4" }}>
                        💡 <strong>Novo por aqui?</strong> Faça login com sua conta do Google ou Microsoft para criar seu cadastro no grupo Minas Bahia.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos customizados para garantir botões de OAuth idênticos em fonte, altura e hover */}
      <style>
        {`
          .btn-oauth-custom {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            height: 40px;
            background-color: #ffffff !important;
            color: #3c4043 !important;
            border: 1px solid #dadce0 !important;
            border-radius: 20px !important;
            font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 0 16px !important;
            text-decoration: none !important;
            cursor: pointer;
            transition: all 0.2s ease-in-out !important;
            box-shadow: none !important;
            outline: none !important;
          }

          .btn-oauth-custom:hover,
          .btn-oauth-custom:focus,
          .btn-oauth-custom:active {
            background-color: #f8f9fa !important;
            color: #1f1f1f !important;
            border-color: #d2e3fc !important;
            box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Login;

