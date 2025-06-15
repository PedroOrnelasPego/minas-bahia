// src/pages/AreaGraduado/Login/Login.jsx
import { useMsal } from "@azure/msal-react";

const Login = () => {
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    try {
      await instance.loginRedirect();
    } catch (error) {
      console.error("Erro ao logar com Microsoft:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <button
        onClick={handleMicrosoftLogin}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Entrar com Microsoft
      </button>
    </div>
  );
};

export default Login;
