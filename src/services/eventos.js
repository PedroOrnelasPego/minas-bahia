import http from "./http";

/** GRUPOS */
export async function listGroups() {
  const { data } = await http.get("/eventos/groups");
  return Array.isArray(data) ? data : data.groups || [];
}

export async function createGroup(payload) {
  const { data } = await http.post("/eventos/groups", payload);
  return data;
}

export async function deleteGroup(groupSlug) {
  await http.delete(`/eventos/groups/${groupSlug}`);
}

export async function uploadGroupCover(groupSlug, file, name) {
  const fd = new FormData();
  fd.append("cover", file);
  const qs = name ? `?name=${encodeURIComponent(name)}` : "";
  const { data } = await http.post(
    `/eventos/groups/${groupSlug}/cover${qs}`,
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data; // { url }
}

/** ÁLBUNS */
export async function listAlbums(groupSlug) {
  const { data } = await http.get(`/eventos/${groupSlug}/albums`);
  return Array.isArray(data) ? data : data.albums || [];
}

export async function createAlbum(groupSlug, payload) {
  const { data } = await http.post(`/eventos/${groupSlug}/albums`, payload);
  return data;
}

export async function deleteAlbum(groupSlug, albumSlug) {
  await http.delete(`/eventos/${groupSlug}/albums/${albumSlug}`);
}

export async function uploadAlbumCover(groupSlug, albumSlug, file, name) {
  const fd = new FormData();
  fd.append("cover", file);
  const qs = name ? `?name=${encodeURIComponent(name)}` : "";
  const { data } = await http.post(
    `/eventos/${groupSlug}/albums/${albumSlug}/cover${qs}`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data; // { url }
}

/** FOTOS */
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
  return data; // { added: [...] }
}

export async function deletePhoto(groupSlug, albumSlug, name) {
  const encoded = encodeURIComponent(name);
  await http.delete(`/eventos/${groupSlug}/${albumSlug}/photos/${encoded}`);
}

// grupos
export async function updateGroupTitle(groupSlug, title) {
  const { data } = await http.put(`/eventos/groups/${groupSlug}/title`, {
    title,
  });
  return data;
}

// álbuns
export async function updateAlbumTitle(groupSlug, albumSlug, title) {
  const { data } = await http.put(
    `/eventos/${groupSlug}/albums/${albumSlug}/title`,
    { title }
  );
  return data;
}

export async function deleteGroupCover(groupSlug) {
  await http.delete(`/eventos/groups/${groupSlug}/cover`);
}
export async function deleteAlbumCover(groupSlug, albumSlug) {
  await http.delete(`/eventos/${groupSlug}/albums/${albumSlug}/cover`);
}
