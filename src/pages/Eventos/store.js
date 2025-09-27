// armazenamento simples em sessionStorage até integrar com o backend

const KEY = "albumGroups";

export const slugify = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const loadGroups = () => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveGroups = (groups) => {
  sessionStorage.setItem(KEY, JSON.stringify(groups));
};
