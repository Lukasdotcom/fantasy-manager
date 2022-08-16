import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";

export default async function handler(req, res) {
  const session = await getSession({ req });
  const league = req.query.league;
  if (!session) {
    res.status(401).end("Not logged in");
  } else {
    const user = session.user.id;
    const connection = await connect();
    // Gets users money
    const money = await connection
      .query("SELECT money FROM leagueUsers WHERE leagueID=? and user=?", [
        league,
        user,
      ])
      .then((e) => (e.length > 0 ? e[0].money : false));
    // Gets the leagues settings
    const leagueSettings = (
      await connection.query(
        "SELECT transfers, duplicatePlayers FROM leagueSettings WHERE leagueID=?",
        [league]
      )
    )[0];
    switch (req.method) {
      // Used to return a dictionary of all transfers and ownerships
      case "GET":
        if (money !== false) {
          const [transfers, squads, transferOpen, timeLeft] = await Promise.all(
            [
              // Gets list of all transfers
              connection.query("SELECT * FROM transfers WHERE leagueID=?", [
                league,
              ]),
              // Gets squads
              connection.query("SELECT * FROM squad WHERE leagueID=?", [
                league,
              ]),
              // Checks if the transfer market is open
              connection
                .query("SELECT value2 FROM data WHERE value1='transferOpen'")
                .then((result) => result[0].value2 === "true"),
              // Gets the amount of time left in the transfer period
              connection
                .query("SELECT value2 FROM data WHERE value1='countdown'")
                .then((result) => parseInt(result[0].value2)),
            ]
          );
          // Puts all the ownership and transfer info in a dictionary
          let ownership = {};
          let transferCount = 0;
          squads.forEach((e) => {
            if (ownership[e.playeruid] === undefined) {
              ownership[e.playeruid] = [{ transfer: false, owner: e.user }];
            } else {
              ownership[e.playeruid].push({ transfer: false, owner: e.user });
            }
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
              ownership[e.playeruid] = ownership[e.playeruid].filter(
                (f) => e.seller !== f.owner
              );
              ownership[e.playeruid].push(data);
            }
            if (e.seller == user || e.buyer == user) {
              transferCount++;
            }
          });
          res.status(200).json({
            money: await money,
            transferCount,
            timeLeft,
            ownership,
            transferOpen,
          });
        } else {
          res.status(404).end("League not found");
        }
        break;
      // Used to create a new transfer
      case "POST":
        const playeruid = req.body.playeruid;
        // Gets the value of the player
        const value = await connection
          .query("SELECT * FROM players WHERE uid=?", [playeruid])
          .then((result) => (result.length > 0 ? result[0].value : false));
        // Promise that returns false if this transfer can not be done and sold when it is a sale and bought when it is a purchase
        const valid = await new Promise(async (resolve) => {
          // Checks if the transfer market is still open
          const transferOpen =
            (
              await connection.query(
                "SELECT value2 FROM data WHERE value1='transferOpen'"
              )
            )[0].value2 === "true";
          if (transferOpen) {
            // Checks if the user still can transfer a player
            const squadSize = (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? and user=?",
                [league, user]
              )
            ).length;
            if (squadSize == 0) {
              resolve(true);
            } else {
              const transfers = await connection.query(
                "SELECT * FROM transfers WHERE leagueID=? and (buyer=? or seller=?)",
                [league, user, user]
              );
              resolve(
                transfers.filter((e) => e.playeruid == playeruid).length <
                  leagueSettings.transfers
              );
            }
          } else {
            resolve(false);
          }
        }).then(async (e) => {
          return e
            ? await new Promise(async (resolve) => {
                // Checks if it is a purchase or a sale
                const playerOwned =
                  (
                    await connection.query(
                      "SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?",
                      [league, user, playeruid]
                    )
                  ).length > 0;
                if (playerOwned > 0) {
                  // Checks if the player is already being sold
                  const playerBeingSold =
                    (
                      await connection.query(
                        "SELECT * FROM transfers WHERE leagueID=? and playeruid=?",
                        [league, playeruid]
                      )
                    ).length > 0;
                  if (!playerBeingSold) {
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
                } else {
                  if (value === false) {
                    resolve("Player does not exist");
                  } else {
                    const transfers = await connection.query(
                      "SELECT * FROM transfers WHERE leagueID=? and playeruid=?",
                      [league, playeruid]
                    );
                    // Checks if the player is already being purchase by the user
                    if (transfers.filter((e) => e.buyer === user).length > 0) {
                      resolve("Bought");
                    } else {
                      const squads = await connection.query(
                        "SELECT * FROM squad WHERE leagueID=? and playeruid=?",
                        [league, playeruid]
                      );
                      // Gets all the players that will still be in the squad after the transfer
                      const playersInSquad = squads.filter(
                        (e) =>
                          transfers.filter((e2) => e.user === e2.seller)
                            .length == 0
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
                        let purchaseAmount = transfers[0].value + 100000;
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
                            "UPDATE transfers SET buyer=?, value=?, position='bench', starred=0 WHERE seller=? AND buyer=? AND leagueID=? AND playeruid=?",
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
                  }
                }
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
