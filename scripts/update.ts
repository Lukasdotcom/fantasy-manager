import noAccents from "#Modules/normalize";
import connect, {
  clubs,
  data,
  plugins as pluginsType,
} from "../Modules/database";
import { calcPoints } from "./calcPoints";
import plugins from "./data";
import { downloadPicture } from "./pictures";
// Used to update all the data
export async function updateData(url: string, file = "./sample/data1.json") {
  // Defaults to the first plugin in the list if testing(should be Bundesliga)
  if (process.env.APP_ENV === "test") {
    url = Object.keys(plugins)[0];
  }
  const currentTime = Math.floor(Date.now() / 1000);
  // Checks if the league is included
  if (!Object.keys(plugins).includes(url)) {
    console.error(`Unknown league ${url} data was requested`);
    return;
  }
  const connection = await connect();
  // Updates the internal data for the player update data
  const leagueData: pluginsType[] = await connection.query(
    "SELECT * FROM plugins WHERE url=?",
    [url],
  );
  if (leagueData.length == 0) {
    console.error(`Can not locate league ${url}`);
    return;
  }
  const league = leagueData[0].name;
  const lastUpdate: data[] = await connection.query(
    "SELECT * FROM data WHERE value1=?",
    ["playerUpdate" + league],
  );
  if (lastUpdate.length == 0) {
    lastUpdate.push({
      value1: "playerUpdate" + league,
      value2: "0",
    });
  }
  connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["playerUpdate" + league, currentTime, currentTime],
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
  const settings = JSON.parse(leagueData[0].settings);
  // If testing mode is enabled a local file is read
  if (process.env.APP_ENV == "test") {
    settings.file = file;
  }
  // Gets the data. Note that the last match points are ignored and calculated using total points
  const [newTransfer, countdown, players, clubs] = await plugins[url](
    settings,
    {
      players: await connection.query("SELECT * FROM players WHERE league=?", [
        league,
      ]),
      clubs: await connection.query("SELECT * FROM clubs"),
      timestamp: parseInt(lastUpdate[0].value2),
    },
  ).catch((e) => {
    console.error(
      `Error - Failed to get data for ${league}(if this happens to often something is wrong) with error ${e}`,
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
    ["transferOpen" + league, String(newTransfer), String(newTransfer)],
  );
  connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["countdown" + league, countdown, countdown],
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
  let gameDone = false;
  const getClub = (club: string): clubs => {
    const result = clubs.filter((e) => e.club == club);
    if (result.length == 0) {
      return { club, gameStart: 0, opponent: "", league, gameEnd: 0 };
    }
    return result[0];
  };
  while (index < players.length) {
    const val = players[index];
    let picture = await connection.query("SELECT * FROM pictures WHERE url=?", [
      val.pictureUrl,
    ]);
    // Adds a new picture to the db if it has not existed yet
    if (picture.length == 0) {
      await connection.query(
        "INSERT INTO pictures (url, height, width) VALUES (?, ?, ?)",
        [val.pictureUrl, val.height, val.width],
      );
      picture = await connection.query("SELECT * FROM pictures WHERE url=?", [
        val.pictureUrl,
      ]);
      if (process.env.DOWNLOAD_PICTURE === "yes") {
        downloadPicture(picture[0].id);
      }
    }
    const pictureID = picture[0].id;
    index++;
    // Gets the club data
    if (val.club != club) {
      club = val.club;
      const clubData = getClub(club);
      // Checks if the game has started
      clubDone = !(clubData.gameStart >= currentTime || newTransfer);
      gameDone = parseInt(lastUpdate[0].value2) > clubData.gameEnd;
      connection.query(
        "INSERT INTO clubs (club, gameStart, gameEnd, opponent, league) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?, league=?",
        [
          clubData.club,
          clubData.gameStart,
          clubData.gameEnd,
          clubData.opponent,
          clubData.league,
          clubData.opponent,
          clubData.league,
        ],
      );
      // If the game has not started yet the game start time is updated
      if (!clubDone) {
        connection.query(
          "UPDATE clubs SET gameStart=?, gameEnd=? WHERE club=?",
          [clubData.gameStart, clubData.gameEnd, clubData.club],
        );
      }
      // If the game has not been finished the game end time is updated
      if (!gameDone) {
        connection.query("UPDATE clubs SET gameEnd=? WHERE club=?", [
          clubData.gameEnd,
          clubData.club,
        ]);
      }
    }
    // Checks if the player has already been created
    if (
      await connection
        .query("SELECT * FROM players WHERE uid=? AND league=?", [
          val.uid,
          league,
        ])
        .then((res) => res.length == 0)
    ) {
      // Creates the player
      await connection.query(
        "INSERT INTO players (uid, name, nameAscii, club, pictureID, value, sale_price, position, forecast, total_points, average_points, last_match, locked, `exists`, league) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          val.uid,
          val.name,
          noAccents(val.name),
          val.club,
          pictureID,
          val.value,
          val.sale_price || val.value,
          val.position,
          val.forecast || "a",
          val.total_points || val.last_match || 0,
          val.average_points || val.total_points || val.last_match || 0,
          val.last_match || val.total_points || 0,
          clubDone,
          val.exists || true,
          league,
        ],
      );
    } else {
      const {
        uid,
        name,
        club,
        value,
        position,
        forecast,
        total_points,
        last_match,
        exists,
      } = val;
      const sale_price = val.sale_price || value;
      let { average_points } = val;
      const nameAscii = noAccents(name);
      // Updates the player that always will get updated
      await connection.query(
        "UPDATE players SET name=?, nameAscii=?, `exists`=?, locked=? WHERE uid=? AND league=?",
        [name, nameAscii, exists, clubDone, uid, league],
      );
      // Updates the player that will only get updated if the game has not started(This includes when the transfermarket is open)
      if (!clubDone) {
        const data: unknown[] = [forecast];
        let query = "UPDATE players SET forecast=?";
        if (total_points !== undefined) {
          query += ", total_points=?";
          data.push(total_points);
        }
        if (average_points !== undefined) {
          query += ", average_points=?";
          data.push(average_points);
        }
        query += " WHERE uid=? AND league=?";
        data.push(uid, league);
        await connection.query(query, data);
      }
      // Updates player data that will only get updated if the transfer market is open
      if (newTransfer) {
        await connection.query(
          "UPDATE players SET club=?, pictureID=?, value=?, sale_price=?, position=? WHERE uid=? AND league=?",
          [club, pictureID, value, sale_price, position, uid, league],
        );
      }
      // Updates player stats if the game is running and has not ended for too long yet
      if (clubDone && !gameDone) {
        // Calculate all the values if they need to be calculated for last_match and total_points
        if (total_points === undefined) {
          await connection.query(
            "UPDATE players SET total_points=total_points+?-last_match, last_match=? WHERE uid=? AND league=?",
            [last_match || 0, last_match || 0, uid, league],
          );
        } else if (last_match === undefined) {
          await connection.query(
            "UPDATE players SET last_match=last_match+?-total_points, total_points=? WHERE uid=? AND league=?",
            [total_points || 0, total_points || 0, uid, league],
          );
        } else {
          await connection.query(
            "UPDATE players SET last_match=?, total_points=? WHERE uid=? AND league=?",
            [last_match, total_points, uid, league],
          );
        }
        // Calculate all the values if they need to be calculated for average_points
        if (average_points === undefined) {
          average_points =
            (total_points ||
              (await connection
                .query("SELECT * FROM players WHERE uid=? AND league=?")
                .then((e) => e[0].total_points))) /
            ((await connection
              .query(
                "SELECT COUNT(*) as num FROM historicalPlayers WHERE uid=?",
                [uid],
              )
              .then((e) => e[0].num)) +
              1);
          // Rounds average points to the nearest 10th
          average_points = Math.round(average_points * 10) / 10;
        }
        await connection.query(
          "UPDATE players SET average_points=? WHERE uid=? AND league=?",
          [average_points, uid, league],
        );
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

// Used to start the matchday. Runs the transfers and saves historicalTransfers to the table.
export async function startMatchday(league: string) {
  console.log(`Starting matchday for ${league}`);
  const connection = await connect();
  // Goes through every transfer
  let currentleagueID = -1;
  let matchday = 1;
  // Deletes all the transfers that are not fulfilled because the minimum bid was not met
  await connection.query(
    "DELETE FROM transfers WHERE buyer=-1 AND EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=?)",
    [league],
  );
  const transfers = await connection.query(
    "SELECT * FROM transfers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=? AND archived=0) ORDER BY leagueID",
    [league],
  );
  let index = 0;
  while (index < transfers.length) {
    const e = transfers[index];
    index++;
    // Moves the player
    await connection.query(
      "DELETE FROM squad WHERE leagueID=? and playeruid=? and user=?",
      [e.leagueID, e.playeruid, e.seller],
    );
    if (e.buyer != 0) {
      await connection.query(
        "INSERT INTO squad (leagueID, user, playeruid, position, starred) VALUES(?, ?, ?, ?, ?)",
        [e.leagueID, e.buyer, e.playeruid, e.position, e.starred],
      );
    }
    if (e.leagueID !== currentleagueID) {
      currentleagueID = e.leagueID;
      // Calculates the latest matchday for that league
      matchday = await connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
          [currentleagueID],
        )
        .then((result) => (result.length > 0 ? result[0].matchday + 1 : 1));
    }
    // Stores the data in the historical transfers
    connection.query(
      "INSERT INTO historicalTransfers (matchday, leagueID, seller, buyer, playeruid, value) VALUES (?, ?, ?, ?, ?, ?)",
      [matchday, e.leagueID, e.seller, e.buyer, e.playeruid, e.value],
    );
  }
  await connection.query(
    "DELETE FROM transfers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=?)",
    [league],
  );
  console.log(`Simulated every transfer for ${league}`);
  await connection.query("UPDATE players SET last_match=0 WHERE league=?", [
    league,
  ]);
  // Sets up the points to 0 for every player in every league and sets up 0 points for that matchday
  const leagues = await connection.query(
    "SELECT leagueID, user, points FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND archived=0) ORDER BY leagueID",
    [league],
  );
  currentleagueID = -1;
  matchday = 1;
  index = 0;
  // Goes through every league and adds another matchday
  while (index < leagues.length) {
    const e = leagues[index];
    index++;
    if (e.leagueID !== currentleagueID) {
      currentleagueID = e.leagueID;
      // Calculates the latest matchday for that league
      matchday = await connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
          [currentleagueID],
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
      ],
    );
  }
  connection.end();
  await calcPoints(league);
  return;
}
// Runs when the matchday ends. It saves all the squads and players to archival tables.
async function endMatchday(league: string) {
  console.log(`Ending Matchday for ${league}`);
  // Calculates all the points
  await calcPoints(league);
  const connection = await connect();
  const time = Math.floor(Date.now() / 1000);
  // Makes sure all the points have the right time set for them
  await connection.query(
    "UPDATE points SET time=? WHERE time IS NULL AND EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=points.leagueID AND league=?)",
    [time, league],
  );
  console.log(`Archiving player data for ${league}`);
  // Copies all the player data to the historical player data
  await connection.query(
    "INSERT INTO historicalPlayers (time, uid, name, nameAscii, club, pictureID, value, position, forecast, total_points, average_points, last_match, `exists`, league) SELECT ? as time, uid, name, nameAscii, club, pictureID, value, position, forecast, total_points, average_points, last_match, `exists`, league FROM players WHERE league=?",
    [time, league],
  );
  console.log(`Archiving matchday data for ${league}`);
  await connection.query(
    "INSERT INTO historicalClubs (club, opponent, league, time) SELECT club, opponent, league, ? as time FROM clubs WHERE league=?",
    [time, league],
  );
  // Copies all squads into the historical squads
  let currentleagueID = 0;
  console.log(`Archiving user squads for ${league}`);
  const squads = await connection.query(
    "SELECT * FROM squad WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=squad.leagueID AND league=? AND archived=0) ORDER BY leagueID DESC",
    [league],
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
          [currentleagueID],
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
      ],
    );
  }
  // Will revalidate the downloads page so it is up to date
  fetch(process.env.NEXTAUTH_URL_INTERNAL + "/api/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: process.env.NEXTAUTH_SECRET,
      path: "/download",
    }),
  }).catch(() => {});
  connection.end();
  return;
}
