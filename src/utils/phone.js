// src/utils/phone.js
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

// mantém só dígitos
export const onlyDigits = (s = "") => {
  if (typeof s !== 'string') return "";
  return s.replace(/\D/g, "");
};

/**
 * Formata telefone em tempo real (As-You-Type) 
 */
export const maskPhoneBR = (value) => {
  if (!value) return "";
  const str = String(value);
  if (str.startsWith("+")) {
    return new AsYouType().input(str);
  }
  const digits = onlyDigits(str);
  if (digits.length <= 11) {
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  return new AsYouType().input("+" + digits);
};

/**
 * Formata um telefone completo para exibição (formatado com bandeira/país)
 * USADA NO PAINEL ADMIN E PERFIL
 */
export const formatPhoneDisplay = (value, defaultCountry = 'BR') => {
  console.log("formatPhoneDisplay recebendo:", value); // DEBUG
  if (!value) return "-";
  
  const str = String(value).trim();
  
  // Se já tem +, tenta formatar direto
  if (str.startsWith('+')) {
    const phoneNumber = parsePhoneNumberFromString(str);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
  } else {
    // Se não tem +, tenta com BR default
    const phoneNumber = parsePhoneNumberFromString(str, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
  }
  
  // Fallback total: tenta forçar um + se tiver muitos dígitos ou retorna o que veio
  const digits = onlyDigits(str);
  if (digits.length >= 10) {
    const forced = str.startsWith('+') ? str : '+' + digits;
    const ph = parsePhoneNumberFromString(forced);
    if (ph && ph.isValid()) return ph.formatInternational();
  }

  return str; 
};

/**
 * Valida telefone usando metadados globais
 */
export const isValidPhoneGlobal = (value, defaultCountry = 'BR') => {
  if (!value) return false;
  const str = String(value);
  const phoneNumber = parsePhoneNumberFromString(str, defaultCountry);
  return phoneNumber ? phoneNumber.isValid() : false;
};

export const isValidPhoneBR = (value) => isValidPhoneGlobal(value, 'BR');

/**
 * Normaliza para E.164 (ex: +5531989073087) para salvar no banco
 */
export const formatToE164 = (value, defaultCountry = 'BR') => {
  if (!value) return "";
  const str = String(value);
  const phoneNumber = parsePhoneNumberFromString(str, defaultCountry);
  if (phoneNumber && phoneNumber.isValid()) {
    return phoneNumber.format('E.164');
  }
  const digits = onlyDigits(str);
  if (digits.length === 11 || digits.length === 10) return "+55" + digits;
  return str.startsWith("+") ? str : digits;
};

export const unmaskPhone = (value) => onlyDigits(value);
