// src/services/eventos.ts
import http from "./http";

/** GRUPOS */
export async function listGroups() {
  const { data } = await http.get("/eventos/groups");
  return data.groups || data; // [{slug,title,albums?}]
}
export async function createGroup(payload: { slug: string; title: string }) {
  const { data } = await http.post("/eventos/groups", payload);
  return data;
}

/** ÁLBUNS */
export async function listAlbums(groupSlug: string) {
  const { data } = await http.get(`/eventos/${groupSlug}/albums`);
  return data.albums || data; // [{slug,title}]
}
export async function createAlbum(
  groupSlug: string,
  payload: { slug: string; title: string }
) {
  const { data } = await http.post(`/eventos/${groupSlug}/albums`, payload);
  return data;
}

/** FOTOS */
export async function listPhotos(groupSlug: string, albumSlug: string) {
  const { data } = await http.get(`/eventos/${groupSlug}/${albumSlug}/photos`);
  // retorna [{ name, url, size?, contentType? }]
  return data.photos || data;
}

export async function uploadPhotos(
  groupSlug: string,
  albumSlug: string,
  files: File[]
) {
  const fd = new FormData();
  files.forEach((f) => fd.append("fotos", f));
  const { data } = await http.post(
    `/eventos/${groupSlug}/${albumSlug}/photos`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  // data.added = [{name,url}, ...]
  return data;
}

export async function deletePhoto(
  groupSlug: string,
  albumSlug: string,
  name: string
) {
  await http.delete(`/eventos/${groupSlug}/${albumSlug}/photos`, {
    params: { name },
  });
}
