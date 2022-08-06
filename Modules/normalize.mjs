// This is very similar to https://github.com/tyxla/remove-accents/blob/master/index.js but with less characters to improve performance
// List of characters to change
const characterMap = {
  á: "a",
  ą: "a",
  ä: "a",
  Ç: "c",
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
  š: "s",
  ü: "u",
  ý: "y",
  ž: "z",
};
function matcher(match) {
  return characterMap[match];
}
// This function will remove accents and other non ascii symbols
export default function noAccents(word) {
  const chars = Object.keys(characterMap).join("|");
  const allAccents = new RegExp(chars, "g");
  return word.replaceAll(allAccents, matcher);
}
