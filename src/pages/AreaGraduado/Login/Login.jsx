// src/components/Login.jsx
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const Login = ({ onIrParaRegistro }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) setErrorMessage(error.message);
  };

  return (
    <div className="max-w-md mx-auto p-18 m-38 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 px-4 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mt-1 px-4 py-2 border rounded-md"
          />
        </div>

        {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

        <div className="flex justify-between gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={onIrParaRegistro}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
