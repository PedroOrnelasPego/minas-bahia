const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// Helper
async function getJson(url, { signal } = {}) {
  const res = await fetch(url, { signal });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.message || data.erro || data.error)) ||
      `Erro ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Lista a timeline de certificados do usuário.
 * Backend retorna:
 *   { items: [{ id, corda, data, url, fileName, status }] }
 * Retrocompat: se não existir a rota, cai no legado /upload (flat).
 */
export async function listarTimelineCertificados(email, opts = {}) {
  const urlTimeline = `${API_BASE}/upload/timeline?email=${encodeURIComponent(
    email
  )}`;
  try {
    const data = await getJson(urlTimeline, opts);

    if (Array.isArray(data?.items)) {
      return data.items.map((e) => ({
        id: e.id || crypto.randomUUID(),
        corda: String(e.corda || ""),
        data: String(e.data || ""), // yyyy-MM-dd
        url: e.url || "",
        fileName: e.fileName || "",
        status: e.status || "pending",
      }));
    }

    // retrocompat (caso raro)
    if (Array.isArray(data?.arquivos)) {
      return data.arquivos.map((a) => ({
        id: crypto.randomUUID(),
        corda: "",
        data: "",
        url: a.url,
        fileName: a.nome,
        status: "pending",
      }));
    }

    return [];
  } catch {
    // Se /timeline não existir, tenta legado:
    try {
      const legacy = await getJson(
        `${API_BASE}/upload?email=${encodeURIComponent(email)}`,
        opts
      );
      if (Array.isArray(legacy?.arquivos)) {
        return legacy.arquivos.map((a) => ({
          id: crypto.randomUUID(),
          corda: "",
          data: "",
          url: a.url,
          fileName: a.nome,
          status: "pending",
          path: a.path || a.nome || "",
        }));
      }
    } catch {
      /* ignora */
    }
    return [];
  }
}
