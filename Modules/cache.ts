import connect from "./database";
/**
 * Returns the cache length for a league.
 * @param {string} league - The league you want to check.
 * @return {number} The length in seconds that player data can safely be cached for this league.
 */
export const cache = async (league: string): Promise<number> => {
  const connection = await connect();
  let timeLeft: number =
    (await connection
      .query("SELECT * FROM data WHERE value1=?", ["playerUpdate" + league])
      .then((res) => (res.length > 0 ? res[0].value2 : Math.max()))) -
    Math.floor(Date.now() / 1000) +
    parseInt(
      (await connection
        .query("SELECT * FROM data WHERE value1=? AND value2='true'", [
          "transferOpen" + league,
        ])
        .then((res) => res.length > 0))
        ? String(process.env.MIN_UPDATE_TIME_TRANSFER)
        : String(process.env.MIN_UPDATE_TIME),
    );
  connection.end();
  timeLeft = timeLeft > 0 ? timeLeft : 0;
  return timeLeft;
};
