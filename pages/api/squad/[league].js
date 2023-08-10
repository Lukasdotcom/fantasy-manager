import connect from "../../../Modules/database";
import { calcPoints } from "../../../scripts/calcPoints";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
// An array of valid formations
const validFormations = [
  [1, 3, 5, 2],
  [1, 3, 4, 3],
  [1, 4, 4, 2],
  [1, 4, 3, 3],
  [1, 4, 5, 1],
  [1, 5, 3, 2],
  [1, 5, 4, 1],
];

// Used to get the league info
export const getLeagueInfo = async (league, user) => {
  const connection = await connect();
  // Checks if the league exists
  const result = await connection.query(
    "SELECT * FROM leagueUsers WHERE leagueID=? and user=?",
    [league, user],
  );
  if (result.length > 0) {
    const formation = JSON.parse(result[0].formation);
    // Gets all the players on the team
    let players1 = await connection.query(
      "SELECT playeruid, position, starred FROM squad WHERE leagueID=? and user=?",
      [league, user],
    );
    // Checks if a player is being sold
    players1 = await Promise.all(
      players1.map(async (player) => {
        player.status = await connection
          .query(
            "SELECT * FROM transfers WHERE leagueID=? AND playeruid=? AND seller=?",
            [league, player.playeruid, user],
          )
          .then((res) => (res.length > 0 ? "sell" : ""));
        return player;
      }),
    );
    // Gets all the purchases
    let players2 = await connection.query(
      "SELECT playeruid, position, starred FROM transfers WHERE leagueID=? AND buyer=?",
      [league, user],
    );
    // Reformats the player data
    players2.map((player) => {
      player.status = "buy";
      return player;
    });
    // Merges the 2 lists
    const players = [...players1, ...players2];
    connection.end();
    return { formation, players, validFormations };
  } else {
    connection.end();
    throw "League not found";
  }
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const league = req.query.league;
  const connection = await connect();
  if (!session) {
    res.status(401).end("Not logged in");
  } else {
    const user = session.user.id;
    // Checks if the league is archived
    if (
      await connection
        .query("SELECT * FROM leagueSettings WHERE leagueID=? AND archived=0", [
          league,
        ])
        .then((e) => e.length === 0)
    ) {
      res.status(400).end("League is archived");
      return;
    }
    switch (req.method) {
      // Used to return a dictionary of all formations and your current squad and formation
      case "GET":
        await getLeagueInfo(league, user)
          .then((e) => res.status(200).json(e))
          .catch((e) => {
            // Checks if it was the league not found error
            if (e === "League not found") {
              res.status(404).end(e);
            } else {
              throw e;
            }
          });
        break;
      case "POST":
        // Checks if there are enough spots for a position
        function positionOpen(limit, position) {
          return new Promise(async (resolve, reject) => {
            const result = await connection.query(
              `SELECT * FROM squad WHERE position=? AND leagueID=? AND user=?`,
              [position, league, user],
            );
            const result2 = await connection.query(
              "SELECT * FROM transfers WHERE position=? AND leagueID=? AND buyer=?",
              [position, league, user],
            );
            if (result.length + result2.length > limit) {
              reject(`Not enough spots for ${position}`);
            } else {
              resolve(`Enough spots for ${position}`);
            }
          });
        }
        // Checks if the user wants to change the formation
        const formation = req.body.formation;
        if (formation !== undefined) {
          // Checks if this is a valid formation
          let included = false;
          validFormations.forEach((e) => {
            if (JSON.stringify(e) == JSON.stringify(formation)) {
              included = true;
            }
          });
          if (included) {
            // Makes sure to check if the formation can be changed to
            await Promise.all([
              positionOpen(formation[1], "def"),
              positionOpen(formation[2], "mid"),
              positionOpen(formation[3], "att"),
            ])
              .then(() => {
                console.log(
                  `User ${user} changed formation to ${JSON.stringify(
                    formation,
                  )}`,
                );
                connection.query(
                  "UPDATE leagueUsers SET formation=? WHERE leagueID=? and user=?",
                  [JSON.stringify(formation), league, user],
                );
              })
              .catch(() => {
                res.status(500).end("Not enough spots");
              });
          } else {
            res.status(500).end("Invalid formation");
          }
        }
        const star = req.body.star;
        if (Array.isArray(star)) {
          await Promise.all(
            star.map(
              (e) =>
                new Promise(async (resolve, rej) => {
                  const player = String(e);
                  // Checks if the player is on the bench
                  const position = await connection
                    .query(
                      "SELECT position FROM squad WHERE user=? AND leagueID=? AND playeruid=?",
                      [user, league, player],
                    )
                    .then(async (result) =>
                      // If the player was not found in the squad the transfers are checked
                      result.length > 0
                        ? result[0].position
                        : await connection
                            .query(
                              "SELECT position FROM transfers WHERE buyer=? AND leagueID=? AND playeruid=?",
                              [user, league, player],
                            )
                            .then((result) =>
                              result.length > 0 ? result[0].position : "bench",
                            ),
                    );
                  if (position !== "bench") {
                    if (
                      await connection
                        .query(
                          "SELECT locked FROM players WHERE uid=? AND locked=0",
                          [player],
                        )
                        .then((result) => result.length > 0)
                    ) {
                      console.log(`User ${user} starred player ${e}`);
                      await connection.query(
                        "UPDATE squad SET starred=0 WHERE user=? AND position=? AND leagueID=?",
                        [user, position, league],
                      );
                      await connection.query(
                        "UPDATE transfers SET starred=0 WHERE buyer=? AND position=? AND leagueID=?",
                        [user, position, league],
                      );
                      await connection.query(
                        "UPDATE squad SET starred=1 WHERE user=? AND playeruid=? AND leagueID=?",
                        [user, player, league],
                      );
                      await connection.query(
                        "UPDATE transfers SET starred=1 WHERE buyer=? AND playeruid=? AND leagueID=?",
                        [user, player, league],
                      );
                      resolve();
                    } else {
                      rej("Player has already played");
                    }
                  } else {
                    rej("Player is not in the field");
                  }
                }),
            ),
          ).catch((e) => {
            res.status(500).end(e);
          });
        }
        // List of players to move
        const playerMove = req.body.playerMove;
        if (Array.isArray(playerMove)) {
          await Promise.all(
            playerMove.map(
              (e) =>
                new Promise(async (resolve, reject) => {
                  let position = await connection
                    .query(
                      "SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?",
                      [league, user, e],
                    )
                    .then(async (result) =>
                      // If the player was not found in the squad the transfers are checked
                      result.length > 0
                        ? result
                        : await connection.query(
                            "SELECT * FROM transfers WHERE leagueID=? AND buyer=? AND playeruid=?",
                            [league, user, e],
                          ),
                    );
                  // Checks if the player is owned by the user
                  if (position.length > 0) {
                    // Checks what position the player is
                    position = position[0].position;
                    if (position === "bench") {
                      // Finds the players position and checks if they are locked
                      const locked = await connection.query(
                        "SELECT position, locked FROM players WHERE uid=?",
                        [e],
                      );
                      if (locked[0].locked) {
                        reject(`Player is locked`);
                      } else {
                        const playerposition = locked[0].position;
                        // Gets the amount of players on that position
                        const playerAmount =
                          (
                            await connection.query(
                              "SELECT * FROM squad WHERE leagueID=? and user=? and position=?",
                              [league, user, playerposition],
                            )
                          ).length +
                          (
                            await connection.query(
                              "SELECT * FROM transfers WHERE leagueID=? AND buyer=? AND position=?",
                              [league, user, playerposition],
                            )
                          ).length;
                        // Gets the users formation
                        const formation = JSON.parse(
                          (
                            await connection.query(
                              "SELECT formation FROM leagueUsers WHERE leagueID=? and user=?",
                              [league, user],
                            )
                          )[0].formation,
                        );
                        // Checks if there is still room in the formation for this player
                        let transferValid = false;
                        switch (playerposition) {
                          case "gk":
                            transferValid = playerAmount < formation[0];
                            break;
                          case "def":
                            transferValid = playerAmount < formation[1];
                            break;
                          case "mid":
                            transferValid = playerAmount < formation[2];
                            break;
                          case "att":
                            transferValid = playerAmount < formation[3];
                            break;
                        }
                        if (transferValid) {
                          connection.query(
                            "UPDATE squad SET position=? WHERE leagueID=? and user=? and playeruid=?",
                            [playerposition, league, user, e],
                          );
                          connection.query(
                            "UPDATE transfers SET position=? WHERE leagueID=? AND buyer=? AND playeruid=?",
                            [playerposition, league, user, e],
                          );
                          console.log(
                            `User ${user} moved player ${e} to field`,
                          );
                          resolve();
                        } else {
                          reject("No more room in formation");
                        }
                      }
                    } else {
                      // If the player is on the field automatically move them to the bench
                      connection.query(
                        "UPDATE squad SET position='bench', starred=0 WHERE leagueID=? and user=? and playeruid=?",
                        [league, user, e],
                      );
                      connection.query(
                        "UPDATE transfers SET position='bench', starred=0 WHERE leagueID=? and buyer=? and playeruid=?",
                        [league, user, e],
                      );
                      console.log(`User ${user} moved player ${e} to bench`);
                      resolve();
                    }
                  } else {
                    reject(`Player is not your player`);
                  }
                }),
            ),
          ).catch((e) => {
            res.status(500).end(e);
          });
        }
        // Has the point calculation update for that league
        calcPoints(league);
        // If no errors happened gives a succesful result
        if (res.statusMessage === undefined)
          res.status(200).end("Successfully did commands");
        break;
      default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
        break;
    }
  }
  connection.end();
}
