export function onlyDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

export function isValidCPF(cpf) {
  const s = onlyDigits(cpf);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // 000... / 111...

  const calc = (sliceLen) => {
    let sum = 0;
    for (let i = 0; i < sliceLen; i++)
      sum += parseInt(s[i], 10) * (sliceLen + 1 - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = calc(9);
  const d2 = calc(10);
  return d1 === parseInt(s[9], 10) && d2 === parseInt(s[10], 10);
}

export function maskCPF(v = "") {
  const s = onlyDigits(v).slice(0, 11);
  return s
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
