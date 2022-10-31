// This is very similar to https://github.com/tyxla/remove-accents/blob/master/index.js but with less characters to improve performance
// List of characters to change
const characterMap: Record<string, string> = {
  Á: "A",
  á: "a",
  ą: "a",
  ã: "a",
  ä: "a",
  Ç: "C",
  ç: "c",
  ć: "c",
  č: "c",
  é: "e",
  ë: "e",
  è: "e",
  ê: "e",
  ğ: "g",
  í: "i",
  ï: "i",
  ł: "l",
  ñ: "n",
  ń: "n",
  Ö: "O",
  ö: "o",
  ø: "o",
  ō: "o",
  ô: "o",
  ó: "o",
  ř: "r",
  ß: "ss",
  Š: "S",
  š: "s",
  ş: "s",
  ü: "u",
  ú: "u",
  ý: "y",
  ž: "z",
};
function matcher(match: string): string {
  return characterMap[match];
}
// This function will remove accents and other non ascii symbols
export default function noAccents(word: string) {
  const chars = Object.keys(characterMap).join("|");
  const allAccents = new RegExp(chars, "g");
  return word.replaceAll(allAccents, (e) => matcher(e));
}
