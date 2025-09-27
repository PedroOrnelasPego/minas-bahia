// src/services/http.js
import axios from "axios";

// pega da env do Vite (sempre começa com VITE_)
const baseURL = (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "");

// cria instância principal
const http = axios.create({
  baseURL,
  timeout: 15000, // 15s costuma ser mais responsivo que 30s
  withCredentials: false, // true só se usar cookie HttpOnly no back
});

// ----------- Interceptors ----------- //

// request: adiciona headers comuns (ex: token se precisar)
http.interceptors.request.use(
  (config) => {
    // exemplo: Authorization se estiver salvo em localStorage
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // força Accept para JSON
    config.headers.Accept = "application/json";

    return config;
  },
  (error) => Promise.reject(error)
);

// response: normaliza erro
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new Error("Requisição cancelada"));
    }
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Timeout na requisição"));
    }
    if (error.response) {
      // mensagens genéricas (sem vazar stack do back)
      const status = error.response.status;
      const msg =
        status === 401
          ? "Não autorizado"
          : status === 403
          ? "Acesso negado"
          : status === 404
          ? "Recurso não encontrado"
          : "Erro na comunicação com o servidor";
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(error);
  }
);

export default http;
