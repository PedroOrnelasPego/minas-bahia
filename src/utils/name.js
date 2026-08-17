/**
 * Formata um nome próprio no padrão de capitalização em português:
 * - Primeira letra de cada nome/sobrenome em maiúscula (ex: Pedro Henrique Ornellas Pego -> Pedro Henrique Ornellas Pego)
 * - Preposições e conexões ("de", "da", "do", "das", "dos", "e") em minúscula quando estiverem no meio do nome (ex: Pedro de Oliveira, Maria da Silva e Souza)
 * - Se a preposição for a primeira palavra do nome, a primeira letra fica maiúscula (ex: De Oliveira)
 */

const PREPOSICOES_MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

export const formatName = (text) => {
  if (!text || typeof text !== "string") return "";

  // Processa palavra por palavra mantendo a estrutura de espaços (inclusive espaços duplos/finais)
  const words = text.split(" ");

  const formattedWords = words.map((word, index) => {
    if (!word) return "";

    // Suporte para nomes compostos por hífen (ex: Jean-Luc)
    if (word.includes("-")) {
      return word
        .split("-")
        .map((part, pIndex) => formatSingleWord(part, index === 0 && pIndex === 0))
        .join("-");
    }

    return formatSingleWord(word, index === 0);
  });

  return formattedWords.join(" ");
};

const formatSingleWord = (word, isFirstWord) => {
  if (!word) return "";
  const lower = word.toLowerCase();

  if (!isFirstWord && PREPOSICOES_MINUSCULAS.has(lower)) {
    return lower;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};
