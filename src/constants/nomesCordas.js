// constants/nomesCordas.js
export const nomesCordas = {
  // Mirim
  "amarela-mirim": "Amarela Claro",
  "azul-mirim": "Azul Claro",
  "verde-mirim": "Verde Claro",

  // Infantil
  "cru-infantil": "Cru",
  "cru-amarela-infantil": "Cru / Amarela",
  "cru-laranja-infantil": "Cru / Laranja",
  "cru-azul-infantil": "Cru / Azul",
  "cru-verde-infantil": "Cru / Verde",
  "cru-roxa-infantil": "Cru / Roxa",
  "cru-marrom-infantil": "Cru / Marrom",
  "cru-vermelha-infantil": "Cru / Vermelha",

  // Adulto
  "cru-adulto": "Cru",
  "cru-amarela-adulto": "Cru / Amarela",
  "amarela-adulto": "Amarela",
  "amarela-laranja-adulto": "Amarela / Laranja",
  "laranja-adulto": "Laranja",
  "laranja-azul-adulto": "Laranja / Azul (Graduado(a))",
  "azul-adulto": "Azul (Monitor(a))",
  "verde-adulto": "Verde (Instrutor(a))",
  "roxa-adulto": "Roxa (Professor(a))",
  "marrom-adulto": "Marrom (Contra-mestre(a))",

  // Estagiário
  "cru-e-preta-estagiario": "Cru / preta (Estagiário(a))",

  // Mestre
  "vermelha-mestre": "Vermelha (Mestre(a))",
};

export const gruposCordas = [
  { key: "mirim", label: "Mirim (2 a 5 anos)", match: (k) => k.endsWith("-mirim") },
  { key: "infantil", label: "Infantil (6 a 14 anos)", match: (k) => k.endsWith("-infantil") },
  { key: "adulto", label: "Adulto", match: (k) => k.endsWith("-adulto") },
  { key: "estagiario", label: "Estagiário", match: (k) => k.endsWith("-estagiario") },
  { key: "mestre", label: "Mestre", match: (k) => k === "vermelha-mestre" },
];

export const listarCordasPorGrupo = (grupoKey) => {
  const g = gruposCordas.find((x) => x.key === grupoKey);
  if (!g) return [];
  return Object.keys(nomesCordas).filter((k) => g.match(k));
};

export const getCordaNome = (slug) => nomesCordas[slug] || slug || "-";

export default nomesCordas;