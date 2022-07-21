import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";

export default async function handler(req, res) {
  const session = await getSession({ req });
  const league = req.query.league;
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
  if (!session) {
    res.status(401).end("Not logged in");
  } else {
    const user = session.user.id;
    const connection = await connect();
    switch (req.method) {
      // Used to return a dictionary of all formations and your current squad and formation
      case "GET":
        await new Promise(async (resolve) => {
          // Checks if the league exists
          const result = await connection.query(
            "SELECT * FROM leagueUsers WHERE leagueID=? and user=?",
            [league, user]
          );
          if (result.length > 0) {
            const formation = JSON.parse(result[0].formation);
            // Gets all the players on the team
            const players = await connection.query(
              "SELECT playeruid, position FROM squad WHERE leagueID=? and user=?",
              [league, user]
            );
            res.status(200).json({ formation, players, validFormations });
            resolve();
          } else {
            res.status(404).end("League not found");
            resolve();
          }
        });
        break;
      case "POST":
        // Checks if there are enough spots for a position
        function positionOpen(limit, position) {
          return new Promise(async (resolve, reject) => {
            const result = await connection.query(
              `SELECT * FROM squad WHERE position='${position}'`
            );
            if (result.length > limit) {
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
              .catch((val) => {
                res.status(500).end(val);
              })
              .then(() => {
                connection.query(
                  "UPDATE leagueUsers SET formation=? WHERE leagueID=? and user=?",
                  [JSON.stringify(formation), league, user]
                );
              });
          } else {
            res.status(500).end("Invalid formation");
          }
        }
        // List of players to move
        const playerMove = req.body.playerMove;
        if (playerMove !== undefined) {
          if (playerMove.map !== undefined) {
            await Promise.all(
              playerMove.map(
                (e) =>
                  new Promise(async (resolve, reject) => {
                    let position = await connection.query(
                      "SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?",
                      [league, user, e]
                    );
                    // Checks if the player is owned by the user
                    if (position.length > 0) {
                      // Checks what position the player is
                      position = position[0].position;
                      if (position === "bench") {
                        // Finds the players position and checks if they are locked
                        const locked = await connection.query(
                          "SELECT position, locked FROM players WHERE uid=?",
                          [e]
                        );
                        if (locked[0].locked) {
                          reject(`${e} is locked`);
                        } else {
                          const playerposition = locked[0].position;
                          // Gets the amount of players on that position
                          const playerAmount = (
                            await connection.query(
                              "SELECT * FROM squad WHERE leagueID=? and user=? and position=?",
                              [league, user, playerposition]
                            )
                          ).length;
                          // Gets the users formation
                          const formation = JSON.parse(
                            (
                              await connection.query(
                                "SELECT formation FROM leagueUsers WHERE leagueID=? and user=?",
                                [league, user]
                              )
                            )[0].formation
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
                              [playerposition, league, user, e]
                            );
                            console.log(
                              `User ${user} moved player ${e} to field`
                            );
                            resolve();
                          } else {
                            reject("No more room in formation");
                          }
                        }
                      } else {
                        // If the player is on the field automatically move them to the bench
                        connection.query(
                          "UPDATE squad SET position='bench' WHERE leagueID=? and user=? and playeruid=?",
                          [league, user, e]
                        );
                        console.log(`User ${user} moved player ${e} to bench`);
                        resolve();
                      }
                    } else {
                      reject(`${e} is not your player`);
                    }
                  })
              )
            ).catch((e) => {
              res.status(500).end(e);
            });
          }
        }
        // If no errors happened gives a succesful result
        res.status(200).end("Succesfully did commands");
        break;
      default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
        break;
    }
    connection.end();
  }
}
