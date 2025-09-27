// src/services/http.js
import axios from "axios";

const baseURL = import.meta.env?.VITE_API_URL || process.env.VITE_API_URL || "";

const http = axios.create({
  baseURL,
  timeout: 30000,
});

export default http;
