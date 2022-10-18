import connect from "../../../Modules/database.mjs";
import { checkUpdate } from "../../../scripts/checkUpdate";
// Used to return a dictionary on the data for a player
export default async function handler(req, res) {
  if (req.method == "GET") {
    const connection = await connect();
    // Checks if new data needs to be requested
    checkUpdate();
    let result = [];
    if (parseInt(req.query.time) > 0) {
      result = await connection.query(
        "SELECT * FROM historicalPlayers WHERE uid=? AND time=?",
        [req.query.uid, parseInt(req.query.time)]
      );
      if (result.length > 0) {
        result[0].forecast = "a";
      }
    } else {
      // This makes the program wait until all updates are completed
      while (
        await connection
          .query("SELECT * FROM data WHERE value1='locked'")
          .then((res) => res.length > 0)
      ) {
        await new Promise((res) => setTimeout(res, 500));
      }
      result = await connection.query(
        `SELECT * FROM players WHERE uid=? LIMIT 1`,
        [req.query.uid]
      );
      // Adds the game information
      if (result.length > 0) {
        result[0].game = await connection
          .query("SELECT * FROM clubs WHERE club=?", [result[0].club])
          .then((res) =>
            res.length > 0
              ? { opponent: res[0].opponent, gameStart: res[0].gameStart }
              : undefined
          );
      }
    }
    // Tells the user if the updates are still running
    if (result.length > 0) {
      result[0].updateRunning = await connection
        .query("SELECT value2 FROM data WHERE value1='lastUpdateCheck'")
        .then((result) =>
          result.length > 0 ? Date.now() / 1000 - 600 < result[0].value2 : false
        );
    }
    // Checks if the player exists
    if (result.length > 0) {
      // Tells the browser how long to cache if not a development
      if (
        process.env.APP_ENV !== "development" &&
        process.env.APP_ENV !== "test"
      ) {
        const timeLeft =
          (await connection
            .query("SELECT * FROM data WHERE value1='playerUpdate'")
            .then((res) => (res.length > 0 ? res[0].value2 : Math.max()))) -
          parseInt(Date.now() / 1000) +
          parseInt(
            (await connection
              .query(
                "SELECT * FROM data WHERE value1='transferOpen' AND value2='true'"
              )
              .then((res) => res.length > 0))
              ? process.env.MIN_UPDATE_TIME_TRANSFER
              : process.env.MIN_UPDATE_TIME
          );
        res.setHeader(
          "Cache-Control",
          `public, max-age=${parseInt(req.query.time) > 0 ? 604800 : timeLeft}`
        );
      }
      res.status(200).json(result[0]);
    } else {
      res.status(404).end("Player not found");
    }
    connection.end();
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
