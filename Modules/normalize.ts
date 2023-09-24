// This is very similar to https://github.com/tyxla/remove-accents/blob/master/index.js but with less characters to improve performance
// Use the following sql query to find missing accents in the database: SELECT * FROM players WHERE nameAscii REGEXP '[^ -~]';
import connect from "./database";

// List of characters to change
const characterMap: Record<string, string> = {
  Á: "A",
  Â: "A",
  á: "a",
  ą: "a",
  ã: "a",
  ä: "a",
  Ç: "C",
  Č: "C",
  Ć: "C",
  ç: "c",
  ć: "c",
  č: "c",
  É: "E",
  é: "e",
  ë: "e",
  è: "e",
  ê: "e",
  ě: "e",
  ğ: "g",
  í: "i",
  ï: "i",
  î: "i",
  ł: "l",
  ñ: "n",
  ń: "n",
  Ö: "O",
  Ø: "O",
  ö: "o",
  ø: "o",
  ō: "o",
  ô: "o",
  ó: "o",
  ò: "o",
  ř: "r",
  ß: "ss",
  Š: "S",
  š: "s",
  ş: "s",
  ț: "t",
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
export async function normalize_db() {
  console.log(
    "Renormalizing all player names to ascii due to updated definitions.",
  );
  const connection = await connect();
  const unique_players = await connection.query(
    "SELECT DISTINCT name FROM players",
  );
  for (const player of unique_players) {
    connection.query("UPDATE players SET nameAscii=? WHERE name=?", [
      noAccents(player.name),
      player.name,
    ]);
  }
  const unique_historical_players = await connection.query(
    "SELECT DISTINCT name FROM historicalPlayers",
  );
  for (const player of unique_historical_players) {
    connection.query("UPDATE historicalPlayers SET nameAscii=? WHERE name=?", [
      noAccents(player.name),
      player.name,
    ]);
  }
  console.log("Done renormalizing all player names to ascii.");
  connection.end();
}
