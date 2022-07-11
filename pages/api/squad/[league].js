import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const mysql = require("mysql");
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
    var connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    switch (req.method) {
      // Used to return a dictionary of all formations and your current squad and formation
      case "GET":
        await new Promise((resolve) => {
          // Checks if the league exists
          connection.query(
            "SELECT * FROM leagueUsers WHERE leagueID=? and user=?",
            [league, user],
            function (error, result, fields) {
              if (result.length > 0) {
                const formation = JSON.parse(result[0].formation);
                // Gets all the players on the team
                connection.query(
                  "SELECT playeruid, position FROM squad WHERE leagueID=? and user=?",
                  [league, user],
                  function (error, players, fields) {
                    res
                      .status(200)
                      .json({ formation, players, validFormations });
                    resolve();
                  }
                );
              } else {
                res.status(404).end("League not found");
                resolve();
              }
            }
          );
        });
        break;
      case "POST":
        // Checks if there are enough spots for a position
        function positionOpen(limit, position) {
          return new Promise((resolve, reject) => {
            connection.query(
              `SELECT * FROM squad WHERE position='${position}'`,
              function (error, result, fields) {
                if (result.length > limit) {
                  reject(`Not enough spots for ${position}`);
                } else {
                  resolve(`Enough spots for ${position}`);
                }
              }
            );
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
                  new Promise((resolve, reject) => {
                    connection.query(
                      "SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?",
                      [league, user, e],
                      function (error, result, field) {
                        // Checks if the player is owned by the user
                        if (result.length > 0) {
                          // Checks what position the player is
                          let position = result[0].position;
                          if (position === "bench") {
                            // Finds the players position and checks if they are locked
                            connection.query(
                              "SELECT position, locked FROM players WHERE uid=?",
                              [e],
                              function (error, result, field) {
                                if (result[0].locked) {
                                  reject(`${e} is locked`);
                                } else {
                                  const playerposition = result[0].position;
                                  // Gets the amount of players on that position
                                  connection.query(
                                    "SELECT * FROM squad WHERE leagueID=? and user=? and position=?",
                                    [league, user, playerposition],
                                    function (error, result, field) {
                                      const playerAmount = result.length;
                                      // Gets the users formation
                                      connection.query(
                                        "SELECT formation FROM leagueUsers WHERE leagueID=? and user=?",
                                        [league, user],
                                        function (error, result, fields) {
                                          const formation = JSON.parse(
                                            result[0].formation
                                          );
                                          // Checks if there is still room in the formation for this player
                                          let transferValid = false;
                                          switch (playerposition) {
                                            case "gk":
                                              transferValid =
                                                playerAmount < formation[0];
                                              break;
                                            case "def":
                                              transferValid =
                                                playerAmount < formation[1];
                                              break;
                                            case "mid":
                                              transferValid =
                                                playerAmount < formation[2];
                                              break;
                                            case "att":
                                              transferValid =
                                                playerAmount < formation[3];
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
                                      );
                                    }
                                  );
                                }
                              }
                            );
                          } else {
                            // If the player is on the field automatically move them to the bench
                            connection.query(
                              "UPDATE squad SET position='bench' WHERE leagueID=? and user=? and playeruid=?",
                              [league, user, e]
                            );
                            console.log(
                              `User ${user} moved player ${e} to bench`
                            );
                            resolve();
                          }
                        } else {
                          reject(`${e} is not your player`);
                        }
                      }
                    );
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
