import connect from "../Modules/database";
import noAccents from "../Modules/normalize";
import { calcPoints } from "./calcPoints";
// Used to update all the data
export async function updateData(file = "../sample/data1.json") {
  const connection = await connect();
  // Waits until the database is unlocked to prevent to scripts from updating at once
  await new Promise<void>(async (res) => {
    while (
      await connection
        .query("SELECT * FROM data WHERE value1='locked'")
        .then((res) => res.length > 0)
    ) {
      await new Promise((res) => setTimeout(res, 1000));
    }
    res();
  });
  // Locks the database to prevent updates
  connection.query(
    "INSERT IGNORE INTO data (value1, value2) VALUES ('locked', 'locked')"
  );
  const nowTime = Math.floor(Date.now() / 1000);
  connection.query(
    "INSERT INTO data (value1, value2) VALUES('playerUpdate', ?) ON DUPLICATE KEY UPDATE value2=?",
    [nowTime, nowTime]
  );
  // Gets the player data
  const data =
    process.env.APP_ENV !== "test"
      ? await fetch(
          "https://fantasy.bundesliga.com/api/player_transfers/init",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `access_token=${process.env.BUNDESLIGA_API}`,
            },
            body: JSON.stringify({
              payload: {
                offerings_query: {
                  offset: 0,
                  limit: 1000,
                  sort: { order_by: "popularity", order_direction: "desc" },
                },
              },
            }),
          }
        )
          .then(async (val) => {
            if (val.ok) {
              return await val.json();
            } else {
              return "FAILURE";
            }
          })
          .catch(() => "FAILURE")
      : (await import(file)).default;
  // Checks if there was a failure somewhere
  if (data === "FAILURE") {
    console.error(
      "Error - Failed to get data(if this happens to often something is wrong)"
    );
    // Unlocks the database
    connection.query("DELETE FROM data WHERE value1='locked'");
    connection.end();
    return;
  }
  // Puts in the data if the transfermarket is open
  const oldTransfer = await connection
    .query("SELECT * FROM data WHERE value1='transferOpen'")
    .then((result) => {
      if (result.length == 0) {
        return false;
      } else {
        return result[0].value2 === "true";
      }
    });
  let newTransfer = data.opening_hour.opened;
  let countdown = data.opening_hour.countdown / 1000;
  // Defaults to closed if the countdown is less than 0
  if (countdown <= 0) {
    countdown = 0;
    newTransfer = false;
  }
  await connection.query(
    "INSERT INTO data (value1, value2) VALUES('transferOpen', ?) ON DUPLICATE KEY UPDATE value2=?",
    [String(newTransfer), String(newTransfer)]
  );
  connection.query(
    "INSERT INTO data (value1, value2) VALUES('countdown', ?) ON DUPLICATE KEY UPDATE value2=?",
    [countdown, countdown]
  );
  // Checks if the transfer market is closing
  if (newTransfer && !oldTransfer) await endMatchday();
  // Note that this is not complete.
  interface playerData {
    transfer_value: number;
    player: {
      uid: string;
      transfer_value: number;
      statistics: {
        total_points: number;
        average_points: number;
        best_value_rank: number;
        form: number;
        popularity: number;
        last_match_points: number;
      };
      image_urls: {
        default: string;
      };
      nickname: string;
      positions: string[];
      is_locked: boolean;
      match_starts_in: number;
      team: {
        team_code: string;
      };
      next_opponent: {
        team_code: string;
      };
    };
    attendance: {
      forecast: "attending" | "unknown" | "missing";
    };
  }
  // Goes through all of the players and adds their data to the database
  const players: playerData[] = data.offerings.items.sort(
    (a: playerData, b: playerData) =>
      parseInt(a.player.team.team_code, 36) -
      parseInt(b.player.team.team_code, 36)
  );
  await connection.query("UPDATE players SET `exists`=0");
  let index = 0;
  let club = "";
  let clubDone = false;
  const currentTime = Math.floor(Date.now() / 1000);
  while (index < players.length) {
    let val = players[index];
    index++;
    // Checks if it is a matchday
    if (newTransfer) {
      // Updates the club info
      if (club !== val.player.team.team_code) {
        club = val.player.team.team_code;
        // Makes sure to only update the match starts in stat if it is greater than 0
        if (val.player.match_starts_in > 0) {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
            [
              club,
              currentTime + val.player.match_starts_in,
              val.player.next_opponent.team_code,
              currentTime + val.player.match_starts_in,
              val.player.next_opponent.team_code,
            ]
          );
        } else {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
            [
              club,
              currentTime + val.player.match_starts_in,
              val.player.next_opponent.team_code,
              val.player.next_opponent.team_code,
            ]
          );
        }
      }
      await connection.query(
        "INSERT INTO players (uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, locked, `exists`) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE value=?, forecast=?, total_points=?, average_points=?, locked=?, `exists`=1, club=?, pictureUrl=?, position=?",
        [
          val.player.uid,
          val.player.nickname,
          noAccents(val.player.nickname),
          val.player.team.team_code,
          val.player.image_urls.default,
          val.transfer_value,
          val.player.positions[0],
          val.attendance.forecast[0],
          val.player.statistics.total_points,
          val.player.statistics.average_points,
          val.player.statistics.last_match_points,
          val.player.is_locked,
          /*Start of have to update*/ val.transfer_value,
          val.attendance.forecast[0],
          val.player.statistics.total_points,
          val.player.statistics.average_points,
          val.player.is_locked,
          val.player.team.team_code,
          val.player.image_urls.default,
          val.player.positions[0],
        ]
      );
    } else {
      // Updates the club info
      if (club !== val.player.team.team_code) {
        club = val.player.team.team_code;
        // Checks if the club is already done
        clubDone = await connection
          .query("SELECT * FROM clubs WHERE club=?", [club])
          .then((res) =>
            res.length > 0
              ? val.player.next_opponent.team_code !== res[0].opponent
              : false
          );
        // If the club is not done
        if (!clubDone) {
          if (val.player.match_starts_in > 0) {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
              [
                club,
                currentTime + val.player.match_starts_in,
                val.player.next_opponent.team_code,
                currentTime + val.player.match_starts_in,
                val.player.next_opponent.team_code,
              ]
            );
          } else {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
              [
                club,
                currentTime + val.player.match_starts_in,
                val.player.next_opponent.team_code,
                val.player.next_opponent.team_code,
              ]
            );
          }
        }
      }
      // Checks if the player already is in the database or not
      const playerExists = await connection.query(
        "SELECT last_match, total_points FROM players WHERE uid=?",
        [val.player.uid]
      );
      if (playerExists.length == 0) {
        await connection.query(
          "INSERT INTO players (uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, locked, `exists`) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
          [
            val.player.uid,
            val.player.nickname,
            noAccents(val.player.nickname),
            val.player.team.team_code,
            val.player.image_urls.default,
            val.transfer_value,
            val.player.positions[0],
            val.attendance.forecast[0],
            val.player.statistics.total_points,
            val.player.statistics.average_points,
            val.player.statistics.last_match_points,
            val.player.is_locked,
          ]
        );
        // Makes sure that the club is not done for the matchday
      } else if (!clubDone) {
        await connection.query(
          "UPDATE players SET value=?, forecast=?, total_points=?, average_points=?, last_match=?, locked=?, `exists`=1 WHERE uid=?",
          [
            val.transfer_value,
            val.attendance.forecast[0],
            val.player.statistics.total_points,
            val.player.statistics.average_points,
            playerExists[0].last_match +
              val.player.statistics.total_points -
              playerExists[0].total_points,
            val.player.is_locked,
            val.player.uid,
          ]
        );
      } else {
        await connection.query("UPDATE players SET `exists`=1 WHERE uid=?", [
          val.player.uid,
        ]);
      }
    }
  }
  console.log("Downloaded new data");
  // Checks if the matchday is running
  if (!newTransfer) {
    // Checks if the transfer market has just closed or has been closed for a while
    !oldTransfer ? await calcPoints() : await startMatchday();
  }
  // Unlocks the database
  connection.query("DELETE FROM data WHERE value1='locked'");
  connection.end();
}

// Used to start the matchday
export async function startMatchday() {
  console.log("Starting matchday");
  const connection = await connect();
  // Goes through every transfer
  let currentleagueID = -1;
  let matchday = 1;
  const transfers = await connection.query(
    "SELECT * FROM transfers ORDER BY leagueID"
  );
  let index = 0;
  while (index < transfers.length) {
    let e = transfers[index];
    index++;
    // Moves the player
    await connection.query(
      "DELETE FROM squad WHERE leagueID=? and playeruid=? and user=?",
      [e.leagueID, e.playeruid, e.seller]
    );
    if (e.buyer != 0) {
      await connection.query(
        "INSERT INTO squad (leagueID, user, playeruid, position, starred) VALUES(?, ?, ?, ?, ?)",
        [e.leagueID, e.buyer, e.playeruid, e.position, e.starred]
      );
    }
    if (e.leagueID !== currentleagueID) {
      currentleagueID = e.leagueID;
      // Calculates the latest matchday for that league
      matchday = await connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
          [currentleagueID]
        )
        .then((result) => (result.length > 0 ? result[0].matchday + 1 : 1));
    }
    // Stores the data in the historical transfers
    connection.query(
      "INSERT INTO historicalTransfers (matchday, leagueID, seller, buyer, playeruid, value) VALUES (?, ?, ?, ?, ?, ?)",
      [matchday, e.leagueID, e.seller, e.buyer, e.playeruid, e.value]
    );
  }
  await connection.query("DELETE FROM transfers");
  console.log("Simulated every transfer");
  await connection.query("UPDATE players SET last_match=0");
  // Sets up the points to 0 for every player in every league and sets up 0 points for that matchday
  const leagues = await connection.query(
    "SELECT leagueID, user, points FROM leagueUsers ORDER BY leagueID"
  );
  currentleagueID = -1;
  matchday = 1;
  index = 0;
  // Goes through every league and adds another matchday
  while (index < leagues.length) {
    let e = leagues[index];
    index++;
    if (e.leagueID !== currentleagueID) {
      currentleagueID = e.leagueID;
      // Calculates the latest matchday for that league
      matchday = await connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
          [currentleagueID]
        )
        .then((result) => (result.length > 0 ? result[0].matchday + 1 : 1));
    }
    await connection.query(
      "INSERT INTO points (leagueID, user, points, matchday, money) VALUES(?, ?, 0, ?, ?)",
      [
        e.leagueID,
        e.user,
        matchday,
        await connection
          .query("SELECT money FROM leagueUsers WHERE leagueID=? AND user=?", [
            e.leagueID,
            e.user,
          ])
          .then((res) => (res.length > 0 ? res[0].money : 0)),
      ]
    );
  }
  connection.end();
  await calcPoints();
  return;
}
// Runs when the matchday ends
async function endMatchday() {
  console.log("Ending Matchday");
  // Calculates all the points
  await calcPoints();
  const connection = await connect();
  const time = Math.floor(Date.now() / 1000);
  // Makes sure all the points have the right time set for them
  connection.query("UPDATE points SET time=? WHERE time IS NULL", [time]);
  // Copies all the player data to the historical player data
  const players = await connection.query("SELECT * FROM players");
  let counter = 0;
  console.log("Archiving player data");
  while (players.length > counter) {
    const player = players[counter];
    counter++;
    connection.query(
      "INSERT INTO historicalPlayers (time, uid, name, nameAscii, club, pictureUrl, value, position, total_points, average_points, last_match, `exists`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        time,
        player.uid,
        player.name,
        noAccents(player.name),
        player.club,
        player.pictureUrl,
        player.value,
        player.position,
        player.total_points,
        player.average_points,
        player.last_match,
        player.exists,
      ]
    );
  }
  // Copies all squads into the historical squads
  const squads = await connection.query(
    "SELECT * FROM squad ORDER BY leagueID DESC"
  );
  counter = 0;
  let matchday = 1;
  let currentleagueID = 0;
  console.log("Archiving user squads");
  while (squads.length > counter) {
    const squad = squads[counter];
    counter++;
    // Checks if the leagues matchday has already been calculated
    if (squad.leagueID !== currentleagueID) {
      currentleagueID = squad.leagueID;
      // Calculates the latest matchday for that league
      matchday = await connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
          [currentleagueID]
        )
        .then((result) => (result.length > 0 ? result[0].matchday : 1));
    }
    connection.query(
      "INSERT INTO historicalSquad (matchday, leagueID, user, playeruid, position, starred) VALUES (?, ?, ?, ?, ?, ?)",
      [
        matchday,
        squad.leagueID,
        squad.user,
        squad.playeruid,
        squad.position,
        squad.starred,
      ]
    );
  }
  connection.end();
  return;
}
