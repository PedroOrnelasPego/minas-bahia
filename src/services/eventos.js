// src/services/eventos.js
import http from "./http";

/** ================== GRUPOS ================== */
export async function listGroups() {
  const { data } = await http.get("/eventos/groups");
  // backend deve retornar [{slug,title,coverUrl}]
  return Array.isArray(data) ? data : data.groups || [];
}

export async function createGroup({ slug, title }) {
  const { data } = await http.post("/eventos/groups", { slug, title });
  return data;
}

export async function deleteGroup(groupSlug) {
  await http.delete(`/eventos/groups/${groupSlug}`);
}

/** título do grupo */
export async function updateGroupTitle(groupSlug, title) {
  await http.put(`/eventos/groups/${groupSlug}`, { title });
}

/** capa do grupo (multipart) */
export async function uploadGroupCover(groupSlug, file) {
  const fd = new FormData();
  fd.append("capa", file);
  await http.post(`/eventos/groups/${groupSlug}/cover`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** ================== ÁLBUNS ================== */
export async function listAlbums(groupSlug) {
  const { data } = await http.get(`/eventos/${groupSlug}/albums`);
  // esperado: [{slug,title,coverUrl, count?}]
  return Array.isArray(data) ? data : data.albums || [];
}

export async function createAlbum(groupSlug, { slug, title }) {
  const { data } = await http.post(`/eventos/${groupSlug}/albums`, {
    slug,
    title,
  });
  return data;
}

export async function deleteAlbum(groupSlug, albumSlug) {
  await http.delete(`/eventos/${groupSlug}/albums/${albumSlug}`);
}

export async function updateAlbumTitle(groupSlug, albumSlug, title) {
  await http.put(`/eventos/${groupSlug}/albums/${albumSlug}`, { title });
}

export async function uploadAlbumCover(groupSlug, albumSlug, file) {
  const fd = new FormData();
  fd.append("capa", file);
  await http.post(
    `/eventos/${groupSlug}/albums/${albumSlug}/cover`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
}

/** ================== FOTOS ================== */
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
  return data; // { added: [{name,url}, ...] }
}

export async function deletePhoto(groupSlug, albumSlug, name) {
  await http.delete(`/eventos/${groupSlug}/${albumSlug}/photos`, {
    params: { name },
  });
}
