import connect, { clubs, leagues, players } from "../Modules/database";
import dataGetter from "../types/data";
import { calcPoints } from "./calcPoints";
// Used to update all the data
export async function updateData(
  league: string,
  file = "../../sample/data1.json"
) {
  const currentTime = Math.floor(Date.now() / 1000);
  // A dictionary of all the data generators
  const dataGetter: {
    [Key: string]: (arg0: string | undefined) => Promise<dataGetter>;
  } = {
    Bundesliga: (await import("./data/Bundesliga")).default,
    EPL: (await import("./data/EPL")).default,
    WorldCup2022: (await import("./data/WorldCup2022")).default,
  };
  // Checks if the league is included
  if (!leagues.includes(league)) {
    console.error(`Unknown league ${league} data was requested`);
    return;
  }
  const connection = await connect();
  // Updates the internal data for the player update data
  connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["playerUpdate" + league, currentTime, currentTime]
  );
  // Waits until the database is unlocked to prevent to scripts from updating at once
  await new Promise<void>(async (res) => {
    while (
      await connection
        .query("SELECT * FROM data WHERE value1=?", ["locked" + league])
        .then((res) => res.length > 0)
    ) {
      await new Promise((res) => setTimeout(res, 1000));
    }
    res();
  });
  // Locks the database to prevent updates
  connection.query("INSERT IGNORE INTO data (value1, value2) VALUES (?, ?)", [
    "locked" + league,
    "locked" + league,
  ]);
  // Gets the old transfer status
  const oldTransfer = await connection
    .query("SELECT * FROM data WHERE value1=?", ["transferOpen" + league])
    .then((result) => {
      if (result.length == 0) {
        return false;
      } else {
        return result[0].value2 === "true";
      }
    });
  // Gets the data. Note that the last match points are ignored and calculated using total points
  const [newTransfer, countdown, players, clubs] = await dataGetter[league](
    process.env.APP_ENV === "test" ? file : undefined
  ).catch((e) => {
    console.error(
      `Error - Failed to get data for ${league}(if this happens to often something is wrong) with error ${e}`
    );
    // Unlocks the database
    connection.query("DELETE FROM data WHERE value1=?", ["locked" + league]);
    connection.end();
    const returnValue: ["FAILURE", "FAILURE", "FAILURE", "FAILURE"] = [
      "FAILURE",
      "FAILURE",
      "FAILURE",
      "FAILURE",
    ];
    return returnValue;
  });
  // Checks if any errors happened and ends erverything
  if (newTransfer == "FAILURE") {
    return;
  }
  // Updates countdown and the transfer market status
  await connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["transferOpen" + league, String(newTransfer), String(newTransfer)]
  );
  connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["countdown" + league, countdown, countdown]
  );
  // Checks if the transfer market is closing
  if (newTransfer && !oldTransfer) await endMatchday(league);
  // Sets every player as notexisting
  await connection.query("UPDATE players SET `exists`=0 WHERE league=?", [
    league,
  ]);
  let index = 0;
  let club = "";
  let clubDone = false;
  let gameStart = 0;
  const getClub = (club: string): clubs => {
    const result = clubs.filter((e) => e.club == club);
    if (result.length == 0) {
      return { club, gameStart: 0, opponent: "", league };
    }
    return result[0];
  };
  while (index < players.length) {
    let val = players[index];
    index++;
    // Checks if it is a matchday
    if (newTransfer) {
      // Updates the club info if it is a new club
      if (club !== val.club) {
        club = val.club;
        const clubData = getClub(club);
        // Makes sure to only update the match starts in stat if it is greater than 0
        if (clubData.gameStart > currentTime) {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
            [
              club,
              clubData.gameStart,
              clubData.opponent,
              league,
              clubData.gameStart,
              clubData.opponent,
            ]
          );
        } else {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
            [
              club,
              clubData.gameStart,
              clubData.opponent,
              league,
              clubData.opponent,
            ]
          );
        }
      }
      await connection.query(
        "INSERT INTO players (uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, locked, `exists`, league) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?) ON DUPLICATE KEY UPDATE name=?, nameAscii=?, value=?, forecast=?, total_points=?, average_points=?, locked=?, `exists`=1, club=?, pictureUrl=?, position=?",
        [
          val.uid,
          val.name,
          val.nameAscii,
          val.club,
          val.pictureUrl,
          val.value,
          val.position,
          val.forecast,
          val.total_points,
          val.average_points,
          val.last_match,
          val.locked,
          league,
          /*Start of have to update*/
          val.name,
          val.nameAscii,
          val.value,
          val.forecast,
          val.total_points,
          val.average_points,
          val.locked,
          val.club,
          val.pictureUrl,
          val.position,
        ]
      );
    } else {
      // Updates the club info if it changed
      if (club !== val.club) {
        club = val.club;
        // Gets the club data
        const clubData = getClub(club);
        // Checks if the club is already done
        clubDone = await connection
          .query("SELECT * FROM clubs WHERE club=? AND league=?", [
            club,
            league,
          ])
          .then((res) =>
            res.length > 0 ? clubData.opponent !== res[0].opponent : false
          );
        gameStart = clubData.gameStart;
        // Checks if the club has not changed during the matchday
        if (!clubDone) {
          // Checks if the game is supposed to have already started
          if (gameStart > currentTime) {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
              [
                club,
                clubData.gameStart,
                clubData.opponent,
                league,
                clubData.gameStart,
                clubData.opponent,
              ]
            );
          } else {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
              [
                club,
                clubData.gameStart,
                clubData.opponent,
                league,
                clubData.opponent,
              ]
            );
          }
        }
      }
      // Checks if the player already is in the database or not
      const playerExists: players[] = await connection.query(
        "SELECT * FROM players WHERE uid=?",
        [val.uid]
      );
      if (playerExists.length == 0) {
        await connection.query(
          "INSERT INTO players (uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, locked, `exists`, league) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
          [
            val.uid,
            val.name,
            val.nameAscii,
            val.club,
            val.pictureUrl,
            val.value,
            val.position,
            val.forecast,
            val.total_points,
            val.average_points,
            val.last_match,
            val.locked,
            league,
          ]
        );
        // Makes sure that the club is not done for the matchday
      } else if (!clubDone) {
        // Does not update the forecast if you are too far through the game
        if (gameStart + 600 <= currentTime) {
          await connection.query(
            "UPDATE players SET value=?, total_points=?, average_points=?, last_match=?, locked=?, `exists`=1 WHERE uid=?",
            [
              val.value,
              val.total_points,
              val.average_points,
              playerExists[0].last_match +
                val.total_points -
                playerExists[0].total_points,
              val.locked,
              val.uid,
            ]
          );
        } else {
          await connection.query(
            "UPDATE players SET value=?, forecast=?, total_points=?, average_points=?, last_match=?, locked=?, `exists`=1 WHERE uid=?",
            [
              val.value,
              val.forecast,
              val.total_points,
              val.average_points,
              playerExists[0].last_match +
                val.total_points -
                playerExists[0].total_points,
              val.locked,
              val.uid,
            ]
          );
        }
      } else {
        await connection.query("UPDATE players SET `exists`=1 WHERE uid=?", [
          val.uid,
        ]);
      }
    }
  }
  console.log(`Downloaded new data for ${league}`);
  // Checks if the matchday is running
  if (!newTransfer) {
    // Checks if the transfer market has just closed or has been closed for a while
    !oldTransfer ? await calcPoints(league) : await startMatchday(league);
  }
  // Unlocks the database
  connection.query("DELETE FROM data WHERE value1=?", ["locked" + league]);
  connection.end();
}

// Used to start the matchday
export async function startMatchday(league: string) {
  console.log(`Starting matchday for ${league}`);
  const connection = await connect();
  // Goes through every transfer
  let currentleagueID = -1;
  let matchday = 1;
  // Deletes all the transfers that are not fulfilled because the minimum bid was not met
  await connection.query(
    "DELETE FROM transfers WHERE buyer=-1 AND EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=?)",
    [league]
  );
  const transfers = await connection.query(
    "SELECT * FROM transfers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=? AND archived=0) ORDER BY leagueID",
    [league]
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
  await connection.query(
    "DELETE FROM transfers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=?)",
    [league]
  );
  console.log(`Simulated every transfer for ${league}`);
  await connection.query("UPDATE players SET last_match=0 WHERE league=?", [
    league,
  ]);
  // Sets up the points to 0 for every player in every league and sets up 0 points for that matchday
  const leagues = await connection.query(
    "SELECT leagueID, user, points FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND archived=0) ORDER BY leagueID",
    [league]
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
  await calcPoints(league);
  return;
}
// Runs when the matchday ends
async function endMatchday(league: string) {
  console.log(`Ending Matchday for ${league}`);
  // Calculates all the points
  await calcPoints(league);
  const connection = await connect();
  const time = Math.floor(Date.now() / 1000);
  // Makes sure all the points have the right time set for them
  await connection.query(
    "UPDATE points SET time=? WHERE time IS NULL AND EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=points.leagueID AND league=?)",
    [time, league]
  );
  console.log(`Archiving player data for ${league}`);
  // Copies all the player data to the historical player data
  await connection.query(
    "INSERT INTO historicalPlayers (time, uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, `exists`, league) SELECT ? as time, uid, name, nameAscii, club, pictureUrl, value, position, forecast, total_points, average_points, last_match, `exists`, league FROM players WHERE league=?",
    [time, league]
  );
  console.log(`Archiving matchday data for ${league}`);
  await connection.query(
    "INSERT INTO historicalClubs (club, opponent, league, time) SELECT club, opponent, league, ? as time FROM clubs WHERE league=?",
    [time, league]
  );
  // Copies all squads into the historical squads
  let currentleagueID = 0;
  console.log(`Archiving user squads for ${league}`);
  const squads = await connection.query(
    "SELECT * FROM squad WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=squad.leagueID AND league=? AND archived=0) ORDER BY leagueID DESC",
    [league]
  );
  let counter = 0;
  let matchday = 1;
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
