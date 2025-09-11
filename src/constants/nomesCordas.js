// constants/nomesCordas.js
export const nomesCordas = {
  // Mirim
  "crua-amarela-mirim": "Crua / Amarela Claro",
  "crua-azul-mirim": "Crua / Azul Claro",
  "crua-verde-mirim": "Crua / Verde Claro",

  // Infantil
  "crua-infantil": "Crua",
  "crua-amarela-infantil": "Crua / Amarela",
  "crua-laranja-infantil": "Crua / Laranja",
  "crua-azul-infantil": "Crua / Azul",
  "crua-verde-infantil": "Crua / Verde",
  "crua-roxa-infantil": "Crua / Roxa",
  "crua-marrom-infantil": "Crua / Marrom",
  "crua-vermelha-infantil": "Crua / Vermelha",

  // Adulto
  "crua-adulto": "Crua",
  "crua-amarela-adulto": "Crua / Amarela",
  "amarela-adulto": "Amarela",
  "amarela-laranja-adulto": "Amarela / Laranja",
  "laranja-adulto": "Laranja",
  "laranja-azul-adulto": "Laranja / Azul",
  "azul-adulto": "Azul",
  "verde-adulto": "Verde (Instrutor)",
  "roxa-adulto": "Roxa (Professor)",
  "marrom-adulto": "Marrom (Contra-mestre)",
  "crua-e-preta-adulto": "Crua / preta (Estagiário)",

  // Mestre
  "vermelha-mestre": "Vermelha (Mestre)",
};

export const gruposCordas = [
  { key: "mirim", label: "Mirim (2 a 5 anos)", match: (k) => k.endsWith("-mirim") },
  { key: "infantil", label: "Infantil (6 a 14 anos)", match: (k) => k.endsWith("-infantil") },
  { key: "adulto", label: "Adulto", match: (k) => k.endsWith("-adulto") },
  { key: "mestre", label: "Mestre", match: (k) => k === "vermelha-mestre" },
];

export const listarCordasPorGrupo = (grupoKey) => {
  const g = gruposCordas.find((x) => x.key === grupoKey);
  if (!g) return [];
  return Object.keys(nomesCordas).filter((k) => g.match(k));
};

export const getCordaNome = (slug) => nomesCordas[slug] || slug || "-";

export default nomesCordas;