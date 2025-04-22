import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const Registro = ({ onVoltarParaLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      await supabase.from("perfis").insert([
        {
          id: data.user.id,
          nome,
          apelido: "",
          idade: null,
          sexo: "",
          endereco: "",
        },
      ]);
    }

    setSuccessMessage("Conta criada com sucesso!");
    setLoading(false);
    setEmail("");
    setPassword("");
    setNome("");
  };

  return (
    <div className="max-w-md mx-auto p-18 m-38 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Criar Conta</h2>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full mt-1 px-4 py-2 border rounded-md"
          />
        </div>

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
        {successMessage && (
          <p className="text-green-600 text-sm">{successMessage}</p>
        )}

        <div className="flex justify-between gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Criando..." : "Criar Conta"}
          </button>
          <button
            type="button"
            onClick={onVoltarParaLogin}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Registro;
