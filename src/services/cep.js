// src/services/cep.js

// normaliza resposta do ViaCEP para um shape único
export const normalizeViaCep = (data) => ({
  logradouro: data?.logradouro || "",
  bairro: data?.bairro || "",
  cidade: data?.localidade || "",
  uf: data?.uf || "",
});

export const buscarCep = async (cep) => {
  const clean = (cep || "").replace(/\D/g, "");
  if (!clean) throw new Error("CEP vazio");
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  const data = await res.json();
  if (data?.erro) throw new Error("CEP não encontrado");
  return normalizeViaCep(data);
};
