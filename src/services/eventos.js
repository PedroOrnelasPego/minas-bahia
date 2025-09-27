// src/services/eventos.js
import http from "./http";
import axios from "axios";

/* ----------------------- Helpers ----------------------- */

// codifica com segurança segmentos de path
const enc = (v) => encodeURIComponent(String(v ?? "").trim());

// aplica abort compatível (AbortController nativo; CancelToken fallback p/ Axios < 1)
function withAbort(config = {}, signal) {
  if (!signal) return config;
  const cfg = { ...config, signal };

  // Fallback para Axios < 1
  if (axios.CancelToken && !cfg.cancelToken) {
    const src = axios.CancelToken.source();
    cfg.cancelToken = src.token;

    if (signal.aborted) {
      src.cancel("aborted");
    } else {
      signal.addEventListener("abort", () => src.cancel("aborted"));
    }
  }
  return cfg;
}

// extrai array com fallback consistente
const asArray = (data, key) =>
  Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [];

/* ----------------------- GRUPOS ----------------------- */

export async function listGroups(opts = {}) {
  const { signal } = opts;
  const { data } = await http.get("/eventos/groups", withAbort({}, signal));
  return asArray(data, "groups");
}

export async function createGroup(payload) {
  const { data } = await http.post("/eventos/groups", payload);
  return data;
}

export async function deleteGroup(groupSlug) {
  await http.delete(`/eventos/groups/${enc(groupSlug)}`);
}

export async function uploadGroupCover(groupSlug, file, name) {
  const fd = new FormData();
  fd.append("cover", file);

  const qs = name ? `?name=${enc(name)}` : "";
  const { data } = await http.post(
    `/eventos/groups/${enc(groupSlug)}/cover${qs}`,
    fd
    // NÃO definir Content-Type manual em FormData (o browser seta boundary)
  );
  return data; // { url }
}

/* ----------------------- ÁLBUNS ----------------------- */

export async function listAlbums(groupSlug, opts = {}) {
  const { signal } = opts;
  const { data } = await http.get(
    `/eventos/${enc(groupSlug)}/albums`,
    withAbort({}, signal)
  );
  return asArray(data, "albums");
}

export async function createAlbum(groupSlug, payload) {
  const { data } = await http.post(
    `/eventos/${enc(groupSlug)}/albums`,
    payload
  );
  return data;
}

export async function deleteAlbum(groupSlug, albumSlug) {
  await http.delete(`/eventos/${enc(groupSlug)}/albums/${enc(albumSlug)}`);
}

export async function uploadAlbumCover(groupSlug, albumSlug, file, name) {
  const fd = new FormData();
  fd.append("cover", file);

  const qs = name ? `?name=${enc(name)}` : "";
  const { data } = await http.post(
    `/eventos/${enc(groupSlug)}/albums/${enc(albumSlug)}/cover${qs}`,
    fd
  );
  return data; // { url }
}

/* ----------------------- FOTOS ----------------------- */

export async function listPhotos(groupSlug, albumSlug, opts = {}) {
  const { signal } = opts;
  const { data } = await http.get(
    `/eventos/${enc(groupSlug)}/${enc(albumSlug)}/photos`,
    withAbort({}, signal)
  );
  return asArray(data, "photos");
}

export async function uploadPhotos(groupSlug, albumSlug, files) {
  // aceita FileList/Array; ignora valores falsy
  const list = Array.from(files || []).filter(Boolean);
  if (list.length === 0) {
    return { added: [] };
  }

  const fd = new FormData();
  for (const f of list) fd.append("fotos", f);

  const { data } = await http.post(
    `/eventos/${enc(groupSlug)}/${enc(albumSlug)}/photos`,
    fd
  );
  return data; // { added: [...] }
}

export async function deletePhoto(groupSlug, albumSlug, name) {
  await http.delete(
    `/eventos/${enc(groupSlug)}/${enc(albumSlug)}/photos/${enc(name)}`
  );
}

/* --------------------- Atualizações -------------------- */

// grupos
export async function updateGroupTitle(groupSlug, title) {
  const { data } = await http.put(`/eventos/groups/${enc(groupSlug)}/title`, {
    title,
  });
  return data;
}

// álbuns
export async function updateAlbumTitle(groupSlug, albumSlug, title) {
  const { data } = await http.put(
    `/eventos/${enc(groupSlug)}/albums/${enc(albumSlug)}/title`,
    { title }
  );
  return data;
}

export async function deleteGroupCover(groupSlug) {
  await http.delete(`/eventos/groups/${enc(groupSlug)}/cover`);
}

export async function deleteAlbumCover(groupSlug, albumSlug) {
  await http.delete(
    `/eventos/${enc(groupSlug)}/albums/${enc(albumSlug)}/cover`
  );
}