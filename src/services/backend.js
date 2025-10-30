const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// rotas antigas protegidas por gate
const baseUrlProtegido = `${API_BASE}/perfil`;

// rotas públicas (sem gate) criadas pra mobile
const baseUrlPublico = `${API_BASE}/perfil`; // mesmo prefixo
const selfUrl = `${baseUrlPublico}/self`;

// util fetchJson igual você já tem:
async function fetchJson(
  url,
  { timeoutMs = 12000, retries = 1, ...opts } = {}
) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);

  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  opts.credentials = "include";

  try {
    const res = await fetch(url, { ...opts, headers, signal: ac.signal });
    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const msg =
        (data && (data.message || data.error || data.erro)) ||
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

function cleanId(id) {
  const s = String(id ?? "").trim();
  const safe = s.replace(/[^A-Za-z0-9@._:-]/g, "");
  return encodeURIComponent(safe);
}

// ---------- funcoes exportadas ----------

// criação inicial (pública, POST /perfil)
export async function criarPerfil(perfil) {
  const body = JSON.stringify(perfil ?? {});
  const data = await fetchJson(baseUrlPublico, {
    method: "POST",
    body,
  });
  return data;
}

// atualização PROTEGIDA antiga (PUT /perfil/:email)
// ainda usamos em áreas admin etc.
export async function atualizarPerfil(id, perfilAtualizado, opts = {}) {
  const { signal } = opts;
  const url = `${baseUrlProtegido}/${cleanId(id)}`;
  const body = JSON.stringify(perfilAtualizado ?? {});
  const data = await fetchJson(url, {
    method: "PUT",
    body,
    signal,
  });
  return data;
}

// atualização pública do próprio usuário (PUT /perfil/self)
// => essa que vamos usar no editar perfil da ÁreaGraduado
export async function atualizarPerfilSelf(perfilAtualizado, opts = {}) {
  const { signal } = opts;
  const body = JSON.stringify(perfilAtualizado ?? {});
  const data = await fetchJson(selfUrl, {
    method: "PUT",
    body,
    signal,
  });
  return data;
}

// buscar perfil (GET /perfil/:email) - protegida pelo gate()
// no mobile isso pode falhar se cookie gate sumir, mas deixamos igual
export async function buscarPerfil(id, opts = {}) {
  const { signal } = opts;
  const url = `${baseUrlProtegido}/${cleanId(id)}`;
  const data = await fetchJson(url, { signal });
  return data;
}
