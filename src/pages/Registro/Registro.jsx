import { useState } from "react";
import { supabase } from "../../../supabaseClient"; // ajuste o caminho conforme sua estrutura

const Registro = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    // Realiza o cadastro do usuário com o método signUp do Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Erro no signUp:", error);
      setErrorMessage(error.message);
    } else {
      console.log("Usuário criado com sucesso:", data);
      // Geralmente o Supabase envia um e-mail de confirmação. Informe o usuário.
      setSuccessMessage(
        "Conta criada com sucesso! Verifique seu e-mail para confirmar sua conta."
      );
      // Opcional: Limpar os campos
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "1rem" }}>
      <h2>Criar Conta</h2>
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">E-mail:</label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password">Senha:</label>
          <input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        {/* Exibe mensagem de erro, se houver */}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        {/* Exibe mensagem de sucesso, se houver */}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.5rem 1rem" }}
        >
          {loading ? "Criando Conta..." : "Criar Conta"}
        </button>
      </form>
    </div>
  );
};

export default Registro;
