// services/backend.js

const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// Caminho do recurso
const baseUrl = `${API_BASE}/perfil`;

// ----- Util: pequena ajuda para timeouts, retries e JSON -----
async function fetchJson(
  url,
  { timeoutMs = 12000, retries = 1, ...opts } = {}
) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);

  // headers default
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  // Se usar cookies HttpOnly para sessão no backend, descomente:
  opts.credentials = "include";

  try {
    const res = await fetch(url, { ...opts, headers, signal: ac.signal });
    // Tenta parsear JSON de forma segura
    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      // Mapeia alguns erros comuns sem vazar stack do servidor
      const msg =
        (data && (data.message || data.error)) ||
        (res.status === 401
          ? "Não autorizado"
          : res.status === 403
          ? "Acesso negado"
          : res.status === 404
          ? "Recurso não encontrado"
          : "Erro na requisição");
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data;
  } catch (err) {
    // Retry apenas para falhas de rede/timeout
    const transient =
      err.name === "AbortError" ||
      err.message === "Failed to fetch" ||
      (typeof err.status === "undefined" && !navigator.onLine);

    if (retries > 0 && transient) {
      return fetchJson(url, { ...opts, timeoutMs, retries: retries - 1 });
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Sanitização leve de IDs (evita path traversal acidental)
function cleanId(id) {
  const s = String(id ?? "").trim();
  // permite letras, números, @ . _ - e dois pontos
  const safe = s.replace(/[^A-Za-z0-9@._:-]/g, "");
  return encodeURIComponent(safe);
}

// ----------------- API pública (mesma assinatura) -----------------

export async function criarPerfil(perfil) {
  const body = JSON.stringify(perfil ?? {});
  const data = await fetchJson(baseUrl, {
    method: "POST",
    body,
  });
  // mantém retorno como antes
  return data;
}

export async function atualizarPerfil(id, perfilAtualizado, opts = {}) {
  const { signal } = opts;
  const url = `${baseUrl}/${cleanId(id)}`;
  const body = JSON.stringify(perfilAtualizado ?? {});
  const data = await fetchJson(url, {
    method: "PUT",
    body,
    signal,
  });
  return data;
}

export async function buscarPerfil(id, opts = {}) {
  const { signal } = opts;
  const url = `${baseUrl}/${cleanId(id)}`;
  const data = await fetchJson(url, { signal });
  return data;
}
