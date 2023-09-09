import { NextApiRequest, NextApiResponse } from "next";
import connect, {
  leagueSettings,
  leagueUsers,
  players,
  squad,
  transfers,
} from "../../../Modules/database";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
// This is the structure of the get response
export interface getLeagues {
  money: number;
  transferCount: number;
  timeLeft: number;
  ownership: { [Key: string]: (ownershipInfo | transferInfo)[] };
  transferOpen: boolean;
}
interface ownershipInfo {
  transfer: false;
  owner: number;
}
interface transferInfo {
  transfer: true;
  seller: number;
  buyer: number;
  amount: number;
}
export interface GETResult {
  money: number;
  transferCount: number;
  timeLeft: number;
  ownership: { [Key: string]: (ownershipInfo | transferInfo)[] };
  transferOpen: boolean;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  const league = req.query.league;
  if (!session) {
    res.status(401).end("Not logged in");
  } else {
    const user = session.user.id;
    const connection = await connect();
    // Checks if the league ia rchived
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
    // Gets users money
    const money = await connection
      .query("SELECT money FROM leagueUsers WHERE leagueID=? and user=?", [
        league,
        user,
      ])
      .then((e) => (e.length > 0 ? e[0].money : false));
    // Gets the leagues settings
    const leagueSettings: leagueSettings = (
      await connection.query("SELECT * FROM leagueSettings WHERE leagueID=?", [
        league,
      ])
    )[0];
    // Checks if the transfer market is open
    const transferOpen: boolean = await connection
      .query("SELECT value2 FROM data WHERE value1=?", [
        "transferOpen" + leagueSettings.league,
      ])
      .then((result) => result[0].value2 === "true");
    switch (req.method) {
      // Used to return a dictionary of all transfers and ownerships
      case "GET":
        if (money !== false) {
          const [transfers, squads, timeLeft]: [transfers[], squad[], number] =
            await Promise.all([
              // Gets list of all transfers
              connection.query("SELECT * FROM transfers WHERE leagueID=?", [
                league,
              ]),
              // Gets squads
              connection.query("SELECT * FROM squad WHERE leagueID=?", [
                league,
              ]),
              // Gets the amount of time left in the transfer period
              connection
                .query("SELECT value2 FROM data WHERE value1=?", [
                  "countdown" + leagueSettings.league,
                ])
                .then((result) => parseInt(result[0].value2)),
            ]);
          // Puts all the ownership and transfer info in a dictionary
          const ownership: { [Key: string]: (ownershipInfo | transferInfo)[] } =
            {};
          let transferCount = 0;
          squads.forEach((e) => {
            if (ownership[e.playeruid] === undefined) {
              ownership[e.playeruid] = [{ transfer: false, owner: e.user }];
            } else {
              ownership[e.playeruid].push({ transfer: false, owner: e.user });
            }
          });
          transfers.forEach((e) => {
            const data: transferInfo = {
              transfer: true,
              seller: e.seller,
              buyer: e.buyer,
              amount: e.value,
            };
            if (ownership[e.playeruid] === undefined) {
              ownership[e.playeruid] = [data];
            } else {
              ownership[e.playeruid] = ownership[e.playeruid].filter(
                (f) => e.seller !== (f as ownershipInfo).owner,
              );
              ownership[e.playeruid].push(data);
            }
            if (e.seller == user || e.buyer == user) {
              transferCount++;
            }
          });
          const result: GETResult = {
            money: await money,
            transferCount,
            timeLeft,
            ownership,
            transferOpen,
          };
          res.status(200).json(result);
        } else {
          res.status(404).end("League not found");
        }
        break;
      // Used to create a new transfer
      case "POST":
        const playeruid = req.body.playeruid;
        const amount = parseInt(req.body.amount);
        const players: players[] = await connection.query(
          "SELECT * FROM players WHERE uid=? AND league=?",
          [playeruid, leagueSettings.league],
        );
        // Checks if the player exists
        if (players.length == 0) {
          res.status(404).end("Player does not exist");
          break;
        }
        // Checks if the transfer market is still open
        if (!transferOpen && !leagueSettings.matchdayTransfers) {
          res.status(400).end("Transfer Market is closed");
          break;
        }
        const player = players[0];
        // Says if the user still has transfers left
        const transferLeft =
          (await connection
            .query(
              "SELECT * FROM transfers WHERE leagueID=? AND (seller=? OR buyer=?)",
              [league, user, user],
            )
            .then((res) => res.length < leagueSettings.transfers)) ||
          (
            await connection.query(
              "SELECT * FROM squad WHERE leagueID=? AND user=?",
            )
          ).length == 0;
        // Checks if this was a purchase
        if (amount > 0) {
          // Checks if the player is already owned by the user
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND user=? AND playeruid=?",
                [league, user, playeruid],
              )
            ).length > 0
          ) {
            res.status(400).end("You already own the player");
            break;
          }
          // Checks if the player is already being purchased
          const purchaseTransfer = await connection.query(
            "SELECT * FROM transfers WHERE buyer=? AND playeruid=? AND leagueID=?",
            [user, playeruid, league],
          );
          if (purchaseTransfer.length > 0) {
            // Makes sure the bid is greater than or equal to the current purchase amount
            if (purchaseTransfer[0].value > amount) {
              res
                .status(400)
                .end("You can not bid lower than your current purchase");
              break;
            }
            connection.query(
              "UPDATE transfers SET max=? WHERE buyer=? AND playeruid=? AND leagueID=?",
              [amount, user, playeruid, league],
            );
            res.status(200).end(`Updated max bid to {amount} M`);
            break;
          }
          // Checks if the user still has transfes left
          if (!transferLeft) {
            res.status(400).end("You have no more transfers");
            break;
          }
          // Checks if the player can still be bought from the AI
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND playeruid=?",
                [league, playeruid],
              )
            ).length +
              (
                await connection.query(
                  "SELECT * FROM transfers WHERE seller=0 AND playeruid=? AND leagueID=?",
                  [playeruid, league],
                )
              ).length <
            leagueSettings.duplicatePlayers
          ) {
            // Checks if the user has offered enough money.
            if (amount < player.sale_price) {
              res
                .status(400)
                .end(
                  "You can not buy a player for less than the player's value",
                );
              break;
            }
            if (money < player.sale_price) {
              res.status(400).end("You do not have enough money");
              break;
            }
            connection.query(
              "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value, max) VALUES (?, 0, ?, ?, ?, ?)",
              [league, user, playeruid, player.sale_price, amount],
            );
            connection.query(
              "UPDATE leagueUsers SET money=? WHERE leagueID=? AND user=?",
              [money - player.sale_price, league, user],
            );
            console.log(
              `Player ${playeruid} bought for ${player.sale_price} with max bid of ${amount} by user ${user} in league ${league}`,
            );
            res.status(200).end("Bought player");
            break;
          }
          // Checks if the player can even be bought from anyone
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND playeruid=?",
                [league, playeruid],
              )
            ).length -
              (
                await connection.query(
                  "SELECT * FROM transfers WHERE leagueID=? AND playeruid=? AND seller!=0",
                  [league, playeruid],
                )
              ).length <
            leagueSettings.duplicatePlayers
          ) {
            // Increments all the offers by 100000 until someone drops their transfer
            while (true) {
              const cheapest: transfers[] = await connection.query(
                "SELECT * FROM transfers WHERE leagueID=? AND playeruid=? ORDER BY value ASC LIMIT 1",
                [league, playeruid],
              );
              await new Promise((res) => {
                setTimeout(res, 100);
              });
              // Checks if this is an AI
              const isAI = cheapest[0].buyer === 0 || cheapest[0].buyer === -1;
              // Checks if the player still wants to pay that amount
              if (cheapest[0].value >= amount + (isAI ? 100000 : 0)) {
                res.status(400).end("Not enough money offered");
                break;
              }
              if (cheapest[0].value + 100000 > money + (isAI ? 100000 : 0)) {
                res.status(400).end("You do not have enough money.");
                break;
              }
              // Checks if that player wnats to increment the offer and if they can afford it
              if (
                cheapest[0].max > cheapest[0].value &&
                (await connection
                  .query(
                    "SELECT money FROM leagueUsers WHERE leagueID=? AND user=?",
                    [league, cheapest[0].buyer],
                  )
                  .then((res) => (res.length > 0 ? res[0].money : 0))) >= 100000
              ) {
                console.log(
                  `User ${cheapest[0].buyer} increased bid to ${
                    cheapest[0].value + 100000
                  } for ${playeruid} due to automatic bid increase in league ${league}`,
                );
                // Increases the bidding amount by 100k for that bid
                await Promise.all([
                  connection.query(
                    "UPDATE leagueUsers SET money=money-100000 WHERE user=? AND leagueID=?",
                    [cheapest[0].buyer, league],
                  ),
                  connection.query(
                    "UPDATE leagueUsers SET money=money+100000 WHERE user=? AND leagueID=?",
                    [cheapest[0].seller, league],
                  ),
                  connection.query(
                    "UPDATE transfers SET value=value+100000 WHERE leagueID=? AND buyer=? AND playeruid=?",
                    [league, cheapest[0].buyer, playeruid],
                  ),
                ]);
              } else {
                // Moves transfer to the new bidder
                await Promise.all([
                  // Updates the original buyers money
                  connection.query(
                    "UPDATE leagueUsers SET money=money+? WHERE user=? AND leagueID=?",
                    [cheapest[0].value, cheapest[0].buyer, league],
                  ),
                  // Updates the new buyers money
                  connection.query(
                    "UPDATE leagueUsers SET money=money-? WHERE user=? AND leagueID=?",
                    [cheapest[0].value + (isAI ? 0 : 100000), user, league],
                  ),
                  // Updates the sellers money
                  connection.query(
                    "UPDATE leagueUsers SET money=money+? WHERE user=? AND leagueID=?",
                    [isAI ? 0 : 100000, cheapest[0].seller, league],
                  ),
                  // Updates the transfers data
                  connection.query(
                    "UPDATE transfers SET value=value+?, position='bench', starred=0, buyer=? WHERE leagueID=? AND buyer=? AND playeruid=?",
                    [
                      isAI ? 0 : 100000,
                      user,
                      league,
                      cheapest[0].buyer,
                      playeruid,
                    ],
                  ),
                ]);
                console.log(
                  `User ${user} outbidded ${cheapest[0].buyer} with ${
                    cheapest[0].value + (isAI ? 0 : 100000)
                  } for ${playeruid} in league ${league}`,
                );
                res.status(200).end("Bought player");
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
          const possibleTransfers: transfers[] = await connection.query(
            "SELECT * FROM transfers WHERE leagueID=? AND seller=? AND playeruid=?",
            [league, user, playeruid],
          );
          if (possibleTransfers.length > 0) {
            const possibleTransfer = possibleTransfers[0];
            if (possibleTransfer.value < amount * -1) {
              // Used to check if the buyer has enough money
              const enoughMoney: Promise<boolean> = connection
                .query(
                  "SELECT * FROM leagueUsers WHERE leagueID=? AND user=?",
                  [league, possibleTransfer.buyer],
                )
                .then((e: leagueUsers[]) =>
                  e.length > 0
                    ? e[0].money >= amount * -1 - possibleTransfer.value
                    : false,
                );
              // Checks if the user is willing to pay enough for the player
              if (possibleTransfer.max >= amount * -1 && (await enoughMoney)) {
                await connection.query(
                  "UPDATE transfers SET value=? WHERE leagueID=? AND buyer=? AND seller=? AND playeruid=?",
                  [
                    amount * -1,
                    league,
                    possibleTransfer.buyer,
                    user,
                    playeruid,
                  ],
                );
                await connection.query(
                  "UPDATE leagueUsers SET money=money-? WHERE leagueID=? AND user=?",
                  [
                    amount * -1 - possibleTransfer.value,
                    league,
                    possibleTransfer.buyer,
                  ],
                );
                await connection.query(
                  "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
                  [amount * -1 - possibleTransfer.value, league, user],
                );
              } else {
                if (possibleTransfer.buyer !== -1) {
                  // Makes sure to check if the player has enough money to cancel this
                  if (money < possibleTransfer.value) {
                    res
                      .status(400)
                      .end(
                        `You need to have ${
                          possibleTransfer.value / 1000000
                        }M to increase the minimum amount of the transfer`,
                      );
                    break;
                  }
                  // Makes the transaction a possible offer
                  await connection.query(
                    "UPDATE transfers SET buyer=-1, max=?, value=? WHERE leagueID=? AND seller=? AND playeruid=?",
                    [amount * -1, amount * -1, league, user, playeruid],
                  );
                  await connection.query(
                    "UPDATE leagueUsers SET money=money-? WHERE leagueID=? AND user=?",
                    [possibleTransfer.value, league, user],
                  );
                }
              }
            }
            res.status(200).end("Updated Transfer");
            break;
          }
          // Checks if the player is owned by the user
          if (
            (
              await connection.query(
                "SELECT * FROM squad WHERE leagueID=? AND user=? AND playeruid=?",
                [league, user, playeruid],
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
          const playerValue = player.sale_price;
          // Stores the amount that the user actually wants for the player
          const actualAmount =
            amount * -1 > player.sale_price ? amount * -1 : player.sale_price;
          connection.query(
            "INSERT INTO transfers (leagueID, seller, buyer, playeruid, value, max) VALUES (?, ?, ?, ?, ?, ?)",
            [
              league,
              user,
              actualAmount > player.sale_price ? -1 : 0,
              playeruid,
              actualAmount,
              actualAmount,
            ],
          );
          // Checks if this transaction actually has a seller
          if (actualAmount === playerValue) {
            connection.query(
              "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
              [actualAmount, league, user],
            );
          }
          console.log(
            `User ${user} is ${
              actualAmount > player.sale_price ? "planning to sell" : "selling"
            } ${playeruid} for ${actualAmount} in league ${league}`,
          );
          res
            .status(200)
            .end(
              `${
                actualAmount > player.sale_price
                  ? "Planning to sell"
                  : "Selling"
              } player for minimum of ${actualAmount / 1000000}M`,
            );
          break;
          // Cancels the transaction
        } else {
          // Trys to find the transaction
          const transfer = await connection.query(
            "SELECT * FROM transfers WHERE leagueID=? AND (seller=? OR buyer=?) AND playeruid=?",
            [league, user, user, playeruid],
          );
          if (transfer.length == 0) {
            res.status(404).end("Nonexistant transfer can not be cancelled");
            break;
          }
          // Checks if it was a sale
          if (transfer[0].seller == user) {
            const sale = transfer[0];
            // Checks if this offer was taken and if it was the seller has to give a refund
            if (sale.buyer !== -1) {
              if (money < sale.value) {
                res
                  .status(400)
                  .end(
                    `You need to have ${
                      sale.value / 1000000
                    }M to cancel the transfer`,
                  );
                break;
              }
              connection.query(
                "UPDATE leagueUsers SET money=money-? WHERE leagueID=? AND user=?",
                [sale.value, league, user],
              );
            }
            // Removes the transaction and refunds all the money
            connection.query(
              "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
              [sale.value, league, sale.buyer],
            );
            connection.query(
              "DELETE FROM transfers WHERE leagueID=? AND seller=? AND playeruid=?",
              [league, user, playeruid],
            );
            res.status(200).end("Cancelled transaction");
            console.log(
              `User ${user} cancelled sale of ${playeruid} to ${sale.buyer} for ${sale.value} in league ${league}`,
            );
            break;
          }
          if (transfer[0].buyer == user) {
            const purchase = transfer[0];
            // Removes the canceller from the transaction and refunds them the value of the player
            connection.query(
              "UPDATE leagueUsers SET money=money+? WHERE leagueID=? AND user=?",
              [player.sale_price, league, user],
            );
            await connection.query(
              "UPDATE transfers SET max=?, buyer=0 WHERE leagueID=? AND buyer=? AND playeruid=?",
              [purchase.sale_price, league, user, playeruid],
            );
            connection.query(
              "DELETE FROM transfers WHERE leagueID=? AND buyer=0 AND seller=0 AND playeruid=?",
              [league, playeruid],
            );
            res.status(200).end("Cancelled transaction");
            console.log(
              `User ${user} cancelled purchase of ${playeruid} from ${purchase.buyer} for ${player.sale_price} in league ${league}`,
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
