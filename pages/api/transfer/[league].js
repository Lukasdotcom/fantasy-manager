import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const mysql = require("mysql");
  const session = await getSession({ req });
  const league = req.query.league;
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
    // Gets users money
    const money = await new Promise((resolve) => {
      connection.query(
        "SELECT money FROM leagueUsers WHERE leagueID=? and user=?",
        [league, user],
        function (error, results, fields) {
          resolve(results);
        }
      );
    }).then((e) => (e.length > 0 ? e[0].money : false));
    // Gets the leagues settings
    const leagueSettings = await new Promise((res) => {
      connection.query(
        "SELECT transfers, duplicatePlayers FROM leagueSettings WHERE leagueID=?",
        [league],
        function (error, result, field) {
          res(result[0]);
        }
      );
    });
    switch (req.method) {
      // Used to return a dictionary of all transfers and ownerships
      case "GET":
        if (money !== false) {
          const [transfers, squads, timeLeft] = await Promise.all([
            // Gets list of all transfers
            new Promise((resolve) => {
              connection.query(
                "SELECT * FROM transfers WHERE leagueID=?",
                [league],
                function (error, results, fields) {
                  resolve(results);
                }
              );
            }),
            // Gets squads
            new Promise((resolve) => {
              connection.query(
                "SELECT * FROM squad WHERE leagueID=?",
                [league],
                function (error, results, fields) {
                  resolve(results);
                }
              );
            }),
            // Gets the amount of time left in the transfer period
            new Promise((res) => {
              connection.query(
                "SELECT value2 FROM data WHERE value1='transferOpen'",
                function (error, result, field) {
                  res(parseInt(result[0].value2));
                }
              );
            }),
          ]);
          // Puts all the ownership and transfer info in a dictionary
          let ownership = {};
          let transferCount = 0;
          squads.forEach((e) => {
            ownership[e.playeruid] = [{ transfer: false, owner: e.owner }];
          });
          transfers.forEach((e) => {
            const data = {
              transfer: true,
              seller: e.seller,
              buyer: e.buyer,
              amount: e.value,
            };
            if (ownership[e.playeruid] === undefined) {
              ownership[e.playeruid] = [data];
            } else {
              ownership[e.playeruid].filter((f) => e.seller !== f.owner);
              ownership[e.playeruid].push(data);
            }
            if (e.seller == user || e.buyer == user) {
              transferCount++;
            }
          });
          res
            .status(200)
            .json({ money: await money, transferCount, timeLeft, ownership });
        } else {
          res.status(404).end("League not found");
        }
        break;
      // Used to create a new transfer
      case "POST":
        const playeruid = req.body.playeruid;
        // Gets the value of the player
        const value = await new Promise((resolve) => {
          connection.query(
            "SELECT * FROM players WHERE uid=?",
            [playeruid],
            function (error, result, fields) {
              if (result.length > 0) {
                resolve(result[0].value);
              } else {
                resolve(false);
              }
            }
          );
        });
        // Promise that returns false if this transfer can not be done and sold when it is a sale and bought when it is a purchase
        const valid = await new Promise((resolve) => {
          // Checks if the transfer market is still open
          connection.query(
            "SELECT value2 FROM data WHERE value1='transferOpen'",
            function (error, result, field) {
              if (result[0].value2 > 0) {
                // Checks if the user still can transfer a player
                connection.query(
                  "SELECT * FROM squad WHERE leagueID=? and user=?",
                  [league, user],
                  function (error, result, fields) {
                    if (result.length == 0) {
                      resolve(true);
                    } else {
                      connection.query(
                        "SELECT * FROM transfers WHERE leagueID=? and (buyer=? or seller=?)",
                        [league, user, user],
                        async function (error, result, fields) {
                          // Checks if this is past the limit of players or if this is just an increase on a bid and finds out the limit of players
                          resolve(
                            result.filter((e) => e.playeruid == playeruid)
                              .length < leagueSettings.transfers
                          );
                        }
                      );
                    }
                  }
                );
              } else {
                resolve(false);
              }
            }
          );
        }).then(async (e) => {
          return e
            ? await new Promise((resolve) => {
                // Checks if it is a purchase or a sale
                connection.query(
                  "SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?",
                  [league, user, playeruid],
                  function (error, result, fields) {
                    if (result.length > 0) {
                      // Checks if the player is already being sold
                      connection.query(
                        "SELECT * FROM transfers WHERE leagueID=? and playeruid=?",
                        [league, playeruid],
                        function (error, result, fields) {
                          if (result.length == 0) {
                            connection.query(
                              "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value) VALUES(?, ?, 0, ?, ?)",
                              [league, user, playeruid, value]
                            );
                            connection.query(
                              "UPDATE leagueUsers SET money=? WHERE leagueID=? and user=?",
                              [money + value, league, user]
                            );
                          }
                          resolve("sold");
                        }
                      );
                    } else {
                      if (value === false) {
                        resolve("Player does not exist");
                      } else {
                        connection.query(
                          "SELECT * FROM transfers WHERE leagueID=? and playeruid=?",
                          [league, playeruid],
                          function (error, transfers, field) {
                            // Checks if the player is already being purchase by the user
                            if (
                              transfers.filter((e) => e.buyer === user).length >
                              0
                            ) {
                              resolve("Bought");
                            } else {
                              connection.query(
                                "SELECT * FROM squad WHERE leagueID=? and playeruid=?",
                                [league, playeruid],
                                function (error, squads, field) {
                                  const playersInSquad = squads.filter(
                                    (e) =>
                                      transfers.filter(
                                        (e2) => e.user === e2.seller
                                      ).length == 0
                                  ).length;
                                  // Checks if the player can still be bought from the ai
                                  if (
                                    playersInSquad + transfers.length <
                                    leagueSettings.duplicatePlayers
                                  ) {
                                    // Makes sure the user has enough money
                                    if (value <= money) {
                                      connection.query(
                                        "UPDATE leagueUsers SET money=money-? WHERE leagueID=? and user=?",
                                        [value, league, user]
                                      );
                                      connection.query(
                                        "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value) VALUES(?, 0, ?, ?, ?)",
                                        [league, user, playeruid, value]
                                      );
                                      resolve("bought");
                                    } else {
                                      resolve("Not enough money");
                                    }
                                    // Checks if the player can be bought by overbidding another user
                                  } else if (transfers.length > 0) {
                                    // Sorts all the transfers so the cheapest one can be found
                                    transfers.sort((a, b) => a.value - b.value);
                                    let purchaseAmount =
                                      transfers[0].value + 100000;
                                    let seller = transfers[0].seller;
                                    let buyer = transfers[0].buyer;
                                    // Checks if the user has enough money
                                    if (purchaseAmount <= money) {
                                      connection.query(
                                        "UPDATE leagueUsers SET money=money-? WHERE leagueID=? and user=?",
                                        [purchaseAmount, league, user]
                                      );
                                      connection.query(
                                        "UPDATE leagueUsers SET money=money+? WHERE leagueID=? and user=?",
                                        [purchaseAmount - 100000, league, buyer]
                                      );
                                      connection.query(
                                        "UPDATE leagueUsers SET money=money+100000 WHERE leagueID=? and user=?",
                                        [league, seller]
                                      );
                                      connection.query(
                                        "UPDATE transfers SET buyer=?, value=? WHERE seller=? AND buyer=? AND leagueID=? AND playeruid=?",
                                        [
                                          user,
                                          purchaseAmount,
                                          seller,
                                          buyer,
                                          league,
                                          playeruid,
                                        ]
                                      );
                                      resolve("bought");
                                    } else {
                                      resolve("Not enough money");
                                    }
                                  } else {
                                    resolve("Not for sale");
                                  }
                                }
                              );
                            }
                          }
                        );
                      }
                    }
                  }
                );
              })
            : e;
        });
        if (valid === false) {
          res.status(400).end("No transfers left");
        } else if (["bought", "sold"].includes(valid)) {
          console.log(`User ${user} succesfully ${valid} player ${playeruid}`);
          res.status(200).end(`Succesfully ${valid} player`);
        } else {
          console.warn(
            `User ${user} failed to buy/sell player ${playeruid} due to ${valid}`
          );
          res.status(400).end(valid);
        }
        break;
      default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
        break;
    }
    connection.end();
  }
}
