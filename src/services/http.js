// src/services/http.js
import axios from "axios";

// pega da env do Vite (sempre começa com VITE_)
const baseURL = (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "");

// cria instância principal
const http = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // necessário pra mandar o cookie mbc_gate
});

// ----------- Interceptors ----------- //

// request: adiciona headers comuns (ex: token se precisar)
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers.Accept = "application/json";
    return config;
  },
  (error) => Promise.reject(error)
);

// response: normaliza erro
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error))
      return Promise.reject(new Error("Requisição cancelada"));
    if (error.code === "ECONNABORTED")
      return Promise.reject(new Error("Timeout na requisição"));
    if (error.response) {
      const s = error.response.status;
      const msg =
        s === 401
          ? "Não autorizado"
          : s === 403
          ? "Acesso negado"
          : s === 404
          ? "Recurso não encontrado"
          : "Erro na comunicação com o servidor";
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(error);
  }
);

export default http;
