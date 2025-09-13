// src/utils/address.js

export const buildFullAddress = ({ logradouro, numero, bairro, cidade, uf }) => {
  const parts = [];
  if (logradouro) parts.push(logradouro);
  if (numero) parts.push(numero);
  const linha1 = parts.filter(Boolean).join(", ");
  const linha2 = [bairro, cidade].filter(Boolean).join(", ");
  const ufTxt = uf ? ` - ${uf}` : "";
  return [linha1, linha2].filter(Boolean).join(" - ") + ufTxt;
};
