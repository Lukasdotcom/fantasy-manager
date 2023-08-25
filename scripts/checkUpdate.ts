import connect, { data } from "../Modules/database";

export async function checkUpdate(league: string) {
  const connection = await connect();
  // Checks if matchdays are currently happening and if it is a matchday checks if the update time has passed
  // If it is not a matchday it is checked if the update time for that has passed
  const result: data[] = await connection.query(
    "SELECT value2 FROM data WHERE value1=? or value1=? ORDER BY value1 DESC",
    ["transferOpen" + league, "playerUpdate" + league],
  );
  if (result.length < 2) {
    return;
  }
  if ((await timeUntilUpdate(league)) <= 0) {
    await connection.query(
      "INSERT INTO data (value1, value2) VALUES(?, '1') ON DUPLICATE KEY UPDATE value2=1",
      ["update" + league],
    );
  }
  await connection.end();
}
/**
 * Returns the cache length for a league.
 * @param {string} league - The league you want to check.
 * @param {boolean} max - If you are looking at max or min time
 * @return {number} The length in seconds to wait. If negative this is how late you are
 */
export async function timeUntilUpdate(
  league: string,
  max: boolean = false,
): Promise<number> {
  const connection = await connect();
  // Checks if a game is currently or is about to happen and if it is so if the update time has passed for that
  // If there is no game it is checked if the update time for that has passed
  const result: data[] = await connection.query(
    "SELECT value2 FROM data WHERE value1=? or value1=?",
    ["playerUpdate" + league],
  );
  if (result.length < 1) {
    return 0;
  }
  const gameTime = parseInt(
    (
      await connection.query(
        `SELECT * FROM data WHERE value1='config${
          max ? "Max" : "Min"
        }TimeGame'`,
      )
    )[0].value2,
  );
  const transferTime = parseInt(
    (
      await connection.query(
        `SELECT * FROM data WHERE value1='config${
          max ? "Max" : "Min"
        }TimeTransfer'`,
      )
    )[0].value2,
  );
  const isBeforeGame =
    (
      await connection.query(
        "SELECT * FROM clubs WHERE gameStart < ? AND gameEnd > ? AND league=?",
        [
          Date.now() / 1000 - gameTime + 120,
          Date.now() / 1000 + gameTime,
          league,
        ],
      )
    ).length > 0;
  const value =
    parseInt(result[0].value2) -
    (Date.now() / 1000 - (isBeforeGame ? gameTime : transferTime));
  connection.end();
  return value;
}
