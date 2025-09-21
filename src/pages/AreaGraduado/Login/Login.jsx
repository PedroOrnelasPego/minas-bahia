// src/pages/AreaGraduado/Login/Login.jsx
import { useMsal } from "@azure/msal-react";
import { GoogleLogin } from "@react-oauth/google";
import { setGoogleSession } from "../../../auth/session";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    try {
      await instance.loginRedirect();
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

      // ✅ marca sessão Google centralizada
      setGoogleSession(email);

      // vai para a área protegida
      window.location.replace("/area-graduado");
    } catch (e) {
      console.error(e);
      alert("Falha ao entrar com Google");
    }
  };

  const handleGoogleError = () => {
    alert("Falha no login do Google");
  };

  return (
    <div className="max-w-md mx-auto p-20 m-20 bg-white shadow-lg rounded-lg d-flex flex-column justify-center">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      <div className="mb-3 d-flex justify-content-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      <div className="text-center text-muted my-2">ou</div>

      <button
        onClick={handleMicrosoftLogin}
        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
      >
        Entrar com Microsoft
      </button>
    </div>
  );
};

export default Login;
