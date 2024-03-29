import { NextApiRequest, NextApiResponse } from "next";
import { cache } from "../../../../Modules/cache";
import connect from "../../../../Modules/database";
import { forecast, historicalPlayers, players } from "#types/database";
import { checkUpdate } from "../../../../scripts/checkUpdate";
import { downloadPicture } from "#/scripts/pictures";
// Used to return a dictionary on the data for a player
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<result>,
) {
  if (req.method == "GET") {
    const connection = await connect();
    const league = String(req.query.leagueType);
    const time = parseInt(String(req.query.time));
    const returnValue: result[] = [];
    // Checks if new data needs to be requested
    await checkUpdate(league);
    if (time > 0) {
      const answer: historicalPlayers[] = await connection.query(
        "SELECT * FROM historicalPlayers WHERE uid=? AND time=? AND league=?",
        [req.query.uid, time, league],
      );
      if (answer.length > 0) {
        // Gets the game data
        const game: gameData | undefined = await connection
          .query(
            "SELECT * FROM historicalClubs WHERE club=? AND time=? AND league=?",
            [answer[0].club, time, league],
          )
          .then((res) =>
            res.length > 0 ? { opponent: res[0].opponent } : undefined,
          );
        returnValue.push({
          ...answer[0],
          updateRunning: true,
          game,
        });
      }
    } else {
      let answer: players[] = await connection.query(
        `SELECT * FROM players WHERE uid=? AND league=? LIMIT 1`,
        [req.query.uid, league],
      );
      // Adds the game information
      if (answer.length > 0) {
        // Makes sure that the player data is up to date
        while (
          !answer[0].exists &&
          (await connection
            .query("SELECT * FROM data WHERE value1=?", ["locked" + league])
            .then((res) => res.length > 0))
        ) {
          answer = await connection.query(
            `SELECT * FROM players WHERE uid=? AND league=? LIMIT 1`,
            [req.query.uid, league],
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        const result = answer[0];
        // Finds the historical game that may exist on that day
        const game: gameData | undefined = await connection
          .query("SELECT * FROM clubs WHERE club=? AND league=?", [
            answer[0].club,
            league,
          ])
          .then((res) =>
            res.length > 0
              ? {
                  opponent: res[0].opponent,
                  gameStart: res[0].gameStart,
                  gameEnd: res[0].gameEnd,
                }
              : undefined,
          );
        returnValue.push({ ...result, updateRunning: true, game });
      }
    }
    // Tells the user if the updates are still running
    if (returnValue.length > 0 && time > 0) {
      returnValue[0].updateRunning = await connection
        .query("SELECT value2 FROM data WHERE value1='lastUpdateCheck'")
        .then((result) =>
          result.length > 0
            ? Date.now() / 1000 - 600 < result[0].value2
            : false,
        );
    }
    // Checks if the player exists
    if (returnValue.length > 0) {
      // Tells the browser how long to cache if not a development
      if (
        process.env.APP_ENV !== "development" &&
        process.env.APP_ENV !== "test"
      ) {
        res.setHeader(
          "Cache-Control",
          `public, max-age=${time > 0 ? 604800 : await cache(league)}`,
        );
      }
      const picture = await connection.query(
        "SELECT * FROM pictures WHERE id=?",
        [returnValue[0].pictureID],
      );
      downloadPicture(returnValue[0].pictureID);
      const returnData = {
        ...returnValue[0],
        height: picture[0].height,
        width: picture[0].width,
        downloaded:
          (
            await connection.query(
              "SELECT * FROM data WHERE value1='configDownloadPicture' AND value2='no'",
            )
          ).length > 0
            ? true
            : picture[0].downloaded,
      };
      res.status(200).json(returnData);
    } else {
      res.status(404).end("Player not found");
    }
    connection.end();
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

type gameData = {
  opponent: string;
  gameStart?: number;
  gameEnd?: number;
};

// This is the type returned by this API
export type result = (players | historicalPlayers) & {
  forecast: forecast;
  game?: gameData;
  updateRunning: boolean;
  pictureHeight?: number;
  pictureWidth?: number;
  downloaded?: boolean;
};
