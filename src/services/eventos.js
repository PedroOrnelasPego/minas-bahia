// src/services/eventos.js
import http from "./http";

/** ========== GRUPOS ========== */
export async function listGroups() {
  const { data } = await http.get("/eventos/groups");
  // backend pode responder {groups:[...]} ou lista direta
  return Array.isArray(data) ? data : data.groups || [];
}

export async function createGroup(payload) {
  // payload: { slug, title }
  const { data } = await http.post("/eventos/groups", payload);
  return data;
}

export async function deleteGroup(groupSlug) {
  await http.delete(`/eventos/groups/${groupSlug}`);
}

/** ========== ÁLBUNS ========== */
export async function listAlbums(groupSlug) {
  const { data } = await http.get(`/eventos/${groupSlug}/albums`);
  return Array.isArray(data) ? data : data.albums || [];
}

export async function createAlbum(groupSlug, payload) {
  // payload: { slug, title }
  const { data } = await http.post(`/eventos/${groupSlug}/albums`, payload);
  return data;
}

export async function deleteAlbum(groupSlug, albumSlug) {
  await http.delete(`/eventos/${groupSlug}/albums/${albumSlug}`);
}

/** ========== FOTOS ========== */
export async function listPhotos(groupSlug, albumSlug) {
  const { data } = await http.get(`/eventos/${groupSlug}/${albumSlug}/photos`);
  return Array.isArray(data) ? data : data.photos || [];
}

export async function uploadPhotos(groupSlug, albumSlug, files) {
  const fd = new FormData();
  files.forEach((f) => fd.append("fotos", f));
  const { data } = await http.post(
    `/eventos/${groupSlug}/${albumSlug}/photos`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data; // esperado: { added: [{name,url}, ...] }
}

export async function deletePhoto(groupSlug, albumSlug, name) {
  await http.delete(`/eventos/${groupSlug}/${albumSlug}/photos`, {
    params: { name },
  });
}
