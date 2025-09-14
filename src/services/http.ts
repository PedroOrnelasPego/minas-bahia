// src/services/http.ts
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL;
  timeout: 30000,
});

export default http;
