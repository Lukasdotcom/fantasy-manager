import connect, { leagues, players, position } from "../Modules/database";
import noAccents from "../Modules/normalize";
import { calcPoints } from "./calcPoints";
// Used to update all the data
export async function updateData(
  league: string,
  file = "../sample/data1.json"
) {
  // Checks if the league is included
  if (!leagues.includes(league)) {
    console.error(`Unknown league ${league} data was requested`);
    return;
  }
  const connection = await connect();
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
  const nowTime = Math.floor(Date.now() / 1000);
  connection.query(
    "INSERT INTO data (value1, value2) VALUES(?, ?) ON DUPLICATE KEY UPDATE value2=?",
    ["playerUpdate" + league, nowTime, nowTime]
  );
  // Defaults to bundesliga data
  let fetchData: { link: string; data: any } = {
    link: "https://fantasy.bundesliga.com/api/player_transfers/init",
    data: {
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
    },
  };
  if (league === "EPL") {
    fetchData = {
      link: "https://fantasy.premierleague.com/api/bootstrap-static/",
      data: {},
    };
  }
  // Gets the player data
  const data =
    process.env.APP_ENV !== "test"
      ? await fetch(fetchData.link, fetchData.data)
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
      `Error - Failed to get data for ${league}(if this happens to often something is wrong)`
    );
    // Unlocks the database
    connection.query("DELETE FROM data WHERE value1=?", ["locked" + league]);
    connection.end();
    return;
  }
  // Puts in the data if the transfermarket is open
  const oldTransfer = await connection
    .query("SELECT * FROM data WHERE value1=?", ["transferOpen" + league])
    .then((result) => {
      if (result.length == 0) {
        return false;
      } else {
        return result[0].value2 === "true";
      }
    });
  let newTransfer = false;
  let countdown = 0;
  let teamData: {
    kickoff_time: string;
    team_a: number;
    team_h: number;
  }[] = []; // This is used for the EPL to allow opponents to be shown
  if (league === "Bundesliga") {
    newTransfer = data.opening_hour.opened;
    countdown = data.opening_hour.countdown / 1000;
  } else if (league === "EPL") {
    let counter = 0;
    while (true) {
      if (counter >= data.events.length) {
        break;
      }
      const currentData = data.events[counter];
      if (currentData.finished === false) {
        newTransfer = currentData.deadline_time_epoch - Date.now() / 1000 > 0;
        // Gets the team data for the matchday
        teamData = await fetch(
          `https://fantasy.premierleague.com/api/fixtures/?event=${currentData.id}`
        )
          .then(async (val) => {
            if (val.ok) {
              return await val.json();
            } else {
              return [];
            }
          })
          .catch(() => []);
        countdown = newTransfer
          ? currentData.deadline_time_epoch - Date.now() / 1000
          : 0;
        break;
      }
      counter++;
    }
  }
  // Checks if the team data failed
  if (teamData.length === 0 && league === "EPL") {
    console.error(
      `Error - Failed to get data for ${league}(if this happens to often something is wrong)`
    );
    // Unlocks the database
    connection.query("DELETE FROM data WHERE value1=?", ["locked" + league]);
    connection.end();
    return;
  }
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
  // Note that this is not complete.
  interface playerDataBundesliga {
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
  interface PlayerDataEPL {
    chance_of_playing_this_round: number;
    element_type: number;
    code: number;
    first_name: string;
    now_cost: number;
    points_per_game: string;
    second_name: string;
    team: number;
    total_points: number;
  }
  interface expandedPlayer extends players {
    match_starts_in: number;
    next_opponent: string;
  }

  let playerList;
  if (league === "Bundesliga") {
    playerList = data.offerings.items;
  } else if (league === "EPL") {
    playerList = data.elements;
  }
  // Goes through all of the players and adds their data to the database
  const players: expandedPlayer[] = playerList
    .map((e: playerDataBundesliga | PlayerDataEPL): expandedPlayer => {
      // Makes the data get sorted
      if (league === "Bundesliga") {
        e = e as playerDataBundesliga;
        return {
          uid: e.player.uid,
          name: e.player.nickname,
          nameAscii: noAccents(e.player.uid),
          club: e.player.team.team_code,
          pictureUrl: e.player.image_urls.default,
          value: e.transfer_value,
          position: e.player.positions[0] as position,
          forecast: e.attendance.forecast[0] as "a" | "u" | "m",
          total_points: e.player.statistics.total_points,
          average_points: e.player.statistics.average_points,
          // This is unreliable only use this when it is unknown
          last_match: e.player.statistics.last_match_points,
          locked: e.player.is_locked,
          exists: true,
          league,
          match_starts_in: e.player.match_starts_in,
          next_opponent: e.player.next_opponent.team_code,
        };
      } else {
        const newData = e as PlayerDataEPL;
        let forecast: "a" | "u" | "m" = "u";
        if (newData.chance_of_playing_this_round === 0) {
          forecast = "m";
        } else if (newData.chance_of_playing_this_round === 100) {
          forecast = "a";
        }
        const gettingData = teamData.filter(
          (e2) => e2.team_a === newData.team || e2.team_h === newData.team
        );
        // Checks if the team data could be gotten otherwise junk data is given
        const thisTeamData =
          gettingData.length > 0
            ? gettingData[0]
            : {
                kickoff_time: "2022-10-29T11:30:00Z",
                team_a: 1,
                team_h: 1,
              };
        const getTeam = (id: number): string => {
          id = id - 1;
          return data.teams.length > id ? data.teams[id].short_name : "N/A";
        };
        return {
          uid: String(newData.code),
          name: newData.first_name + " " + newData.second_name,
          nameAscii: noAccents(newData.first_name + " " + newData.second_name),
          club: getTeam(newData.team),
          pictureUrl: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${newData.code}.png`,
          value: newData.now_cost * 100000,
          position: ["", "gk", "def", "mid", "att"][
            newData.element_type
          ] as position,
          forecast,
          total_points: newData.total_points,
          average_points: parseFloat(newData.points_per_game),
          // This is unreliable only use this when it is unknown
          last_match: 0,
          locked: Date.parse(thisTeamData.kickoff_time) < Date.now(),
          exists: true,
          league,
          match_starts_in: Math.floor(
            (Date.parse(thisTeamData.kickoff_time) - Date.now()) / 1000
          ),
          next_opponent:
            thisTeamData.team_a === newData.team
              ? getTeam(thisTeamData.team_h)
              : getTeam(thisTeamData.team_a),
        };
      }
    })
    .sort(
      (a: expandedPlayer, b: expandedPlayer) =>
        parseInt(a.club, 36) - parseInt(b.club, 36)
    );
  await connection.query("UPDATE players SET `exists`=0 WHERE league=?", [
    league,
  ]);
  let index = 0;
  let club = "";
  let clubDone = false;
  const currentTime = Math.floor(Date.now() / 1000);
  while (index < players.length) {
    let val = players[index];
    index++;
    // Checks if it is a matchday
    if (newTransfer) {
      // Updates the club info if it is a new club
      if (club !== val.club) {
        club = val.club;
        // Makes sure to only update the match starts in stat if it is greater than 0
        if (val.match_starts_in > 0) {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
            [
              club,
              currentTime + val.match_starts_in,
              val.next_opponent,
              league,
              currentTime + val.match_starts_in,
              val.next_opponent,
            ]
          );
        } else {
          await connection.query(
            "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
            [
              club,
              currentTime + val.match_starts_in,
              val.next_opponent,
              league,
              val.next_opponent,
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
        // Checks if the club is already done
        clubDone = await connection
          .query("SELECT * FROM clubs WHERE club=? AND league=?", [
            club,
            league,
          ])
          .then((res) =>
            res.length > 0 ? val.next_opponent !== res[0].opponent : false
          );
        // Checks if the club has not changed during the transfer period
        if (!clubDone) {
          if (val.match_starts_in > 0) {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE gameStart=?, opponent=?",
              [
                club,
                currentTime + val.match_starts_in,
                val.next_opponent,
                league,
                currentTime + val.match_starts_in,
                val.next_opponent,
              ]
            );
          } else {
            await connection.query(
              "INSERT INTO clubs (club, gameStart, opponent, league) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE opponent=?",
              [
                club,
                currentTime + val.match_starts_in,
                val.next_opponent,
                league,
                val.next_opponent,
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
    "SELECT * FROM transfers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=transfers.leagueID AND league=?) ORDER BY leagueID",
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
    "SELECT leagueID, user, points FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=?) ORDER BY leagueID",
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
  connection.query(
    "UPDATE points SET time=? WHERE time IS NULL AND EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=points.leagueID AND league=?)",
    [time]
  );
  // Copies all the player data to the historical player data
  const players = await connection.query(
    "SELECT * FROM players WHERE league=?",
    [league]
  );
  let counter = 0;
  console.log(`Archiving player data for ${league}`);
  while (players.length > counter) {
    const player = players[counter];
    counter++;
    connection.query(
      "INSERT INTO historicalPlayers (time, uid, name, nameAscii, club, pictureUrl, value, position, total_points, average_points, last_match, `exists`, league) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        time,
        player.uid,
        player.name,
        player.nameAscii,
        player.club,
        player.pictureUrl,
        player.value,
        player.position,
        player.total_points,
        player.average_points,
        player.last_match,
        player.exists,
        league,
      ]
    );
  }
  // Copies all squads into the historical squads
  const squads = await connection.query(
    "SELECT * FROM squad WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=squad.leagueID AND league=?) ORDER BY leagueID DESC",
    [league]
  );
  counter = 0;
  let matchday = 1;
  let currentleagueID = 0;
  console.log(`Archiving user squads for ${league}`);
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
