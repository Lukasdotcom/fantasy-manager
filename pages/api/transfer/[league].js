import { getSession } from "next-auth/react";
import connect from "../../../Modules/database";

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
        const amount = parseInt(req.body.amount);
        let player = await connection.query(
          "SELECT * FROM players WHERE uid=?",
          [playeruid]
        );
        // Checks if the player exists
        if (player.length == 0) {
          res.status(404).end("Player does not exist");
          break;
        }
        player = player[0];
        // Says if the user still has transfers left
        const transferLeft =
          (await connection
            .query(
              "SELECT * FROM transfers WHERE leagueID=? AND (seller=? OR buyer=?)",
              [league, user, user]
            )
            .then((res) => res.length < leagueSettings.transfers)) ||
          (
            await connection.query(
              "SELECT * FROM squad WHERE leagueID=? AND user=?"
            )
          ).length == 0;
        // Checks if this was a purchase
        if (amount > 0) {
          // Checks if the player is already owned by the user
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND user=? AND playeruid=?",
                [league, user, playeruid]
              )
            ).length > 0
          ) {
            res.status(400).end("You already own the player");
            break;
          }
          // Checks if the player is already being purchased
          const purchaseTransfer = await connection.query(
            "SELECT * FROM transfers WHERE buyer=? AND playeruid=? AND leagueID=?",
            [user, playeruid, league]
          );
          if (purchaseTransfer.length > 0) {
            // Makes sure the bid is greater than or equal to the current purchase amount
            if (purchaseTransfer[0].value > amount) {
              res
                .status(400)
                .end("You can not bid lower than your current purchase amount");
              break;
            }
            connection.query(
              "UPDATE transfers SET max=? WHERE buyer=? AND playeruid=? AND leagueID=?",
              [amount, user, playeruid, league]
            );
            res.status(200).end(`Updated max bid to ${amount / 1000000}M`);
            break;
          }
          // Checks if the user still has transfes left
          if (!transferLeft) {
            res.status(400).end("You are out of transfers");
            break;
          }
          // Checks if the player can still be bought from the AI
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND playeruid=?",
                [league, playeruid]
              )
            ).length +
              (
                await connection.query(
                  "SELECT * FROM transfers WHERE seller=0 AND playeruid=? AND leagueID=?",
                  [playeruid, league]
                )
              ).length <
            leagueSettings.duplicatePlayers
          ) {
            // Checks if the user has enough money.
            if (amount < player.value) {
              res
                .status(400)
                .end("You can not buy player for less than player's value");
              break;
            }
            if (money < player.value) {
              res.status(400).end("You do not have enough money");
              break;
            }
            connection.query(
              "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value, max) VALUES (?, 0, ?, ?, ?, ?)",
              [league, user, playeruid, player.value, amount]
            );
            connection.query(
              "UPDATE leagueUsers SET money=? WHERE leagueID=? AND user=?",
              [money - player.value, league, user]
            );
            console.log(
              `Player ${playeruid} bought for ${player.value} with max bid of ${amount} by user ${user}`
            );
            res.status(200).end("Bought player");
            break;
          }
          // Checks if the player can even be bought from anyone
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND playeruid=?",
                [league, playeruid]
              )
            ).length -
              (await connection.query(
                "SELECT * FROM transfers WHERE leagueID=? AND playeruid=? AND seller!=0",
                [league, playeruid]
              )) <
            leagueSettings.duplicatePlayers
          ) {
            // Increments all the offers by 100000 until someone drops their transfer
            while (true) {
              let cheapest = await connection.query(
                "SELECT * FROM transfers WHERE leagueID=? AND playeruid=? ORDER BY value ASC LIMIT 1",
                [league, playeruid]
              );
              await new Promise((res) => {
                setTimeout(res, 100);
              });
              // Checks if the player still wants to pay that amount
              if (cheapest[0].value >= amount) {
                res.status(400).end("Not enough money offered");
                break;
              }
              if (cheapest[0].value + 100000 > money) {
                res.status(400).end("You do not have enough money.");
                break;
              }
              // Checks if that player wnats to increment the offer and if they can afford it
              if (
                cheapest[0].max > cheapest[0].value &&
                (await connection
                  .query(
                    "SELECT money FROM leagueUsers WHERE leagueID=? AND user=?",
                    [league, cheapest[0].buyer]
                  )
                  .then((res) => (res.length > 0 ? res[0].money : 0))) >= 100000
              ) {
                console.log(
                  `User ${cheapest[0].buyer} increased bid to ${
                    cheapest[0].value + 100000
                  } for ${playeruid} due to automatic bid increase`
                );
                // Increases the bidding amount by 100k for that bid
                await Promise.all([
                  connection.query(
                    "UPDATE leagueUsers SET money=money-100000 WHERE user=? AND leagueID=?",
                    [cheapest[0].buyer, league]
                  ),
                  connection.query(
                    "UPDATE leagueUsers SET money=money+100000 WHERE user=? AND leagueID=?",
                    [cheapest[0].seller, league]
                  ),
                  connection.query(
                    "UPDATE transfers SET value=value+100000 WHERE leagueID=? AND buyer=? AND playeruid=?",
                    [league, cheapest[0].buyer, playeruid]
                  ),
                ]);
              } else {
                // Moves transfer to the new bidder
                await Promise.all([
                  connection.query(
                    "UPDATE leagueUsers SET money=money+? WHERE user=? AND leagueID=?",
                    [cheapest[0].value, cheapest[0].buyer, league]
                  ),
                  connection.query(
                    "UPDATE leagueUsers SET money=money-? WHERE user=? AND leagueID=?",
                    [cheapest[0].value + 100000, user, league]
                  ),
                  connection.query(
                    "UPDATE leagueUsers SET money=money+100000 WHERE user=? AND leagueID=?",
                    [cheapest[0].seller, league]
                  ),
                  connection.query(
                    "UPDATE transfers SET value=value+100000, position='bench', starred=0, buyer=? WHERE leagueID=? AND buyer=? AND playeruid=?",
                    [user, league, cheapest[0].buyer, playeruid]
                  ),
                ]);
                console.log(
                  `User ${user} outbidded ${cheapest[0].buyer} with ${
                    cheapest[0].value + 100000
                  } for ${playeruid}`
                );
                res
                  .status(200)
                  .end(
                    `User ${user} bought player for ${
                      (cheapest[0].value + 100000) / 1000000
                    }M`
                  );
                break;
              }
            }
            break;
          } else {
            res.status(400).end("Player not for sale");
            break;
          }
          // Checks if this is a sale
        } else if (amount < 0) {
          // Checks if the player is already being sold
          if (
            (
              await connection.query(
                "SELECT * FROM transfers WHERE leagueID=? AND seller=? AND playeruid=?",
                [league, user, player]
              )
            ).length > 0
          ) {
            res.status(200).end("You are already selling the player");
            break;
          }
          // Checks if the player is owned by the user
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND user=? AND playeruid=?",
                [league, user, playeruid]
              )
            ).length == 0
          ) {
            res.status(400).end("You don't own this player");
            break;
          }
          // Checks if the user still has a transfer left
          if (!transferLeft) {
            res.status(400).end("You are out of transfers");
            break;
          }
          // Sells the player
          let playerValue = player.value;
          connection.query(
            "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value, max) VALUES (?, ?, 0, ?, ?, ?)",
            [league, user, playeruid, playerValue, playerValue]
          );
          connection.query(
            "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
            [playerValue, league, user]
          );
          console.log(
            `User ${user} is selling ${playeruid} for ${playerValue}`
          );
          res.status(200).end(`Sold player for ${playerValue / 1000000}M`);
          break;
          // Cancels the transaction
        } else {
          // Trys to find the transaction
          const transfer = await connection.query(
            "SELECT * FROM transfers WHERE leagueID=? AND (seller=? OR buyer=?) AND playeruid=?",
            [league, user, user, playeruid]
          );
          if (transfer.length == 0) {
            res.status(404).end("Nonexistant transfer can not be cancelled");
            break;
          }
          // Checks if it was a sale
          if (transfer[0].seller == user) {
            const sale = transfer[0];
            if (money < sale.value) {
              res
                .status(400)
                .end(
                  `You need to have ${money / 1000000}M to cancel the transfer`
                );
              break;
            }
            // Removes the transaction and refunds all the money
            connection.query(
              "UPDATE leagueUsers SET money=money-? WHERE leagueID=? AND user=?",
              [sale.value, league, user]
            );
            connection.query(
              "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
              [sale.value, league, sale.buyer]
            );
            connection.query(
              "DELETE FROM transfers WHERE leagueID=? AND seller=? AND playeruid=?",
              [league, user, playeruid]
            );
            res.status(200).end("Cancelled transaction");
            console.log(
              `User ${user} cancelled sale of ${playeruid} to ${sale.buyer} for ${sale.value}`
            );
            break;
          }
          if (transfer[0].buyer == user) {
            const purchase = transfer[0];
            // Removes the canceller from the transaction and refunds them the value of the player
            connection.query(
              "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
              [player.value, league, user]
            );
            await connection.query(
              "UPDATE transfers SET max=?, buyer=0 WHERE leagueID=? AND buyer=? AND playeruid=?",
              [purchase.value, league, user, playeruid]
            );
            connection.query(
              "DELETE FROM transfers WHERE leagueID=? AND buyer=0 AND seller=0 AND playeruid=?",
              [league, playeruid]
            );
            res.status(200).end("Cancelled transaction");
            console.log(
              `User ${user} cancelled purchase of ${playeruid} from ${purchase.buyer} for ${player.value}`
            );
            break;
          }
        }
        // This will run if something went wrong
        console.log("A transfer failed to finish");
        res.status(500).end("An unknown error happened");
        break;
      default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
        break;
    }
    connection.end();
  }
}
