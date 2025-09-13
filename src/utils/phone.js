// src/utils/phone.js

// mantém só dígitos
export const onlyDigits = (s = "") => s.replace(/\D/g, "");

// (DD) XXXX-XXXX  | (DD) 9XXXX-XXXX  (BR)
export const maskPhoneBR = (value) => {
  const digits = onlyDigits(value);
  if (digits.length <= 10) {
    // (DD) XXXX-XXXX
    return digits.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, d1, d2, d3) =>
        [d1 ? `(${d1}` : "", d1 && d1.length === 2 ? ") " : "", d2, d3 ? `-${d3}` : ""].join("")
    );
  }
  // (DD) 9XXXX-XXXX
  return digits.slice(0, 11).replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, "($1) $2$3-$4");
};

// valida minimamente celular/telefone BR (10 ou 11 dígitos, DDD válido simples)
export const isValidPhoneBR = (value) => {
  const d = onlyDigits(value);
  if (!(d.length === 10 || d.length === 11)) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  return ddd >= 11 && ddd <= 99;
};

// útil pra salvar no backend
export const unmaskPhone = (value) => onlyDigits(value);
