import connect from "#database";
import { clubs } from "#types/database";
import noAccents, { normalize_db } from "../Modules/normalize";
import compileAnalytics from "./compileAnalytics";
/*
 * This function is used to store the upgrades for the db so that startup.ts is smaller.
 *
 * @param {string} oldVersion
 * @returns Promise<string> The updated version
 */
export default async function main(oldVersion: string): Promise<string> {
  const connection = await connect();
  if (oldVersion == "0.1.1") {
    console.log(
      "This version does not have a supported upgrade path to 1.*.*. Due to only me using this program in these versions.",
    );
  }
  if (oldVersion == "1.0.0") {
    console.log("Updating database to version 1.0.7");
    // Moves all of the old league data into the new format
    const leagues = await connection.query("SELECT * FROM leagues");
    leagues.forEach((e) => {
      connection.query(
        "INSERT IGNORE INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)",
        [e.leagueName, e.leagueID],
      );
      connection.query(
        "INSERT INTO leagueUsers (leagueID, user, points, money, formation) VALUES (?, ?, ?, ?, ?)",
        [e.leagueID, e.user, e.points, e.money, e.formation],
      );
    });
    connection.query("DROP TABLE leagues");
    oldVersion = "1.0.7";
  }
  if (oldVersion == "1.0.7") {
    console.log("Updating database to version 1.1.0");
    connection.query(
      "ALTER TABLE leagueSettings ADD startMoney int DEFAULT 150000000",
    );
    connection.query("ALTER TABLE leagueSettings ADD transfers int DEFAULT 6");
    connection.query(
      "ALTER TABLE leagueSettings ADD duplicatePlayers int DEFAULT 1",
    );
    connection.query("ALTER TABLE leagueUsers ADD admin bool DEFAULT 0");
    connection.query("UPDATE leagueUsers SET admin=1");
    oldVersion = "1.1.0";
  }
  if (oldVersion == "1.1.0") {
    console.log("Updating database to version 1.2.0");
    await connection.query("ALTER TABLE points ADD time int");
    await connection.query("UPDATE points SET time=0");
    oldVersion = "1.2.0";
  }
  if (oldVersion == "1.2.0") {
    console.log("Updating database to version 1.3.0");
    await Promise.all([
      connection.query("ALTER TABLE squad ADD starred bool DEFAULT 0"),
      connection.query(
        "ALTER TABLE historicalSquad ADD starred bool DEFAULT 0",
      ),
      connection.query(
        "ALTER TABLE leagueSettings ADD starredPercentage int DEFAULT 150",
      ),
    ]);
    await Promise.all([
      connection.query("UPDATE squad SET starred=0"),
      connection.query("UPDATE historicalSquad SET starred=0"),
      connection.query("UPDATE leagueSettings SET starredPercentage=150"),
    ]);
    oldVersion = "1.3.0";
  }
  if (oldVersion == "1.3.0") {
    console.log("Updating database to version 1.3.1");
    await Promise.all([
      connection.query("ALTER TABLE players ADD nameAscii varchar(255)"),
      connection.query(
        "ALTER TABLE historicalPlayers ADD nameAscii varchar(255)",
      ),
    ]);
    const players = await connection.query("SELECT * FROM players");
    players.forEach((e) => {
      connection.query("UPDATE players SET nameAscii=? WHERE uid=?", [
        noAccents(e.name),
        e.uid,
      ]);
    });
    const historicalPlayers = await connection.query(
      "SELECT * FROM historicalPlayers",
    );
    historicalPlayers.forEach((e) => {
      connection.query("UPDATE historicalPlayers SET nameAscii=? WHERE uid=?", [
        noAccents(e.name),
        e.uid,
      ]);
    });
    oldVersion = "1.3.1";
  }
  if (oldVersion == "1.3.1") {
    console.log("Updating database to version 1.4.3");
    await connection.query(
      "ALTER TABLE transfers ADD position varchar(5) DEFAULT 'bench'",
    );
    await connection.query("ALTER TABLE transfers ADD starred bool DEFAULT 0");
    await connection.query("UPDATE transfers SET position='bench'");
    await connection.query("UPDATE transfers SET starred=0");
    oldVersion = "1.4.3";
  }
  if (oldVersion == "1.4.3") {
    console.log("Updating database to version 1.5.0");
    await connection.query("ALTER TABLE transfers ADD max int");
    await connection.query("UPDATE transfers SET max=value");
    oldVersion = "1.5.0";
  }
  if (oldVersion == "1.5.0") {
    console.log("Updating database to version 1.5.1");
    await connection.query("ALTER TABLE users ADD active bool DEFAULT 0");
    await connection.query("ALTER TABLE users ADD throttle int DEFAULT 30");
    await connection.query(
      "ALTER TABLE users ADD google varchar(255) DEFAULT ''",
    );
    await connection.query(
      "ALTER TABLE users ADD github varchar(255) DEFAULT ''",
    );
    await connection.query(
      "UPDATE users SET google=users.email, github=users.email",
    );
    await connection.query("DELETE FROM data WHERE value1='updateProgram'");
    await connection.query("ALTER TABLE users DROP COLUMN email");
    oldVersion = "1.5.1";
  }
  if (oldVersion == "1.5.1") {
    console.log("Updating database to version 1.7.0");
    await connection.query("ALTER TABLE users ADD admin bool DEFAULT 0");
    await connection.query("ALTER TABLE users ADD favoriteLeague int");
    await connection.query("UPDATE users SET admin=0");
    oldVersion = "1.7.0";
  }
  if (oldVersion == "1.7.0") {
    console.log("Updating database to version 1.8.0");
    // Adds the league column to the db
    await Promise.all([
      connection.query("ALTER TABLE players ADD league varchar(25)"),
      connection.query("ALTER TABLE leagueSettings ADD league varchar(25)"),
      connection.query("ALTER TABLE historicalPlayers ADD league varchar(25)"),
      connection.query("ALTER TABLE clubs ADD league varchar(25)"),
    ]);
    // Sets the league column to bundesliga everywhere
    await Promise.all([
      connection.query("UPDATE players SET league='Bundesliga'"),
      connection.query("UPDATE leagueSettings SET league='Bundesliga'"),
      connection.query("UPDATE historicalPlayers SET league='Bundesliga'"),
      connection.query("UPDATE clubs SET league='Bundesliga'"),
    ]);
    // Deletes some old uneccessary data from the db and moves it to the new data
    await Promise.all([
      connection.query(
        "UPDATE data SET value1='updateBundesliga' WHERE value1='update'",
      ),
      connection.query(
        "UPDATE data SET value1='transferOpenBundesliga' WHERE value1='transferOpen'",
      ),
      connection.query(
        "UPDATE data SET value1='playerUpdateBundesliga' WHERE value1='playerUpdate'",
      ),
      connection.query(
        "UPDATE data SET value1='countdownBundesliga' WHERE value1='countdown'",
      ),
      connection.query("DELETE FROM data WHERE value1='locked'"),
    ]);
    // Adds the new columns to the analytics
    await Promise.all([
      connection.query("ALTER TABLE analytics ADD Bundesliga int"),
      connection.query("ALTER TABLE analytics ADD BundesligaActive int"),
      connection.query("ALTER TABLE analytics ADD EPL int"),
      connection.query("ALTER TABLE analytics ADD EPLActive int"),
    ]);
    await connection.query(
      "UPDATE analytics SET Bundesliga=0, BundesligaActive=0, EPL=0, EPLACTIVE=0",
    );
    oldVersion = "1.8.0";
  }
  if (oldVersion == "1.8.0") {
    console.log("Updating database to version 1.9.0");
    // Adds the new columns to the analytics and the leagueSettings table
    await Promise.all([
      connection.query("ALTER TABLE analytics ADD WorldCup2022 int"),
      connection.query("ALTER TABLE analytics ADD WorldCup2022Active int"),
      connection.query("ALTER TABLE leagueSettings ADD archived int DEFAULT 0"),
    ]);
    await Promise.all([
      connection.query(
        "UPDATE analytics SET WorldCup2022=0, WorldCup2022Active=0",
      ),
      connection.query("UPDATE leagueSettings SET archived=0"),
    ]);
    // Fixes all the player data to have the correct ascii name
    const players = await connection.query("SELECT * FROM players");
    await Promise.all(
      players.map((player) =>
        connection.query("UPDATE players SET nameAscii=? WHERE uid=?", [
          noAccents(player.name),
          player.uid,
        ]),
      ),
    );
    // Fixes all the player data to have the correct historical ascii name
    const historicalPlayers = await connection.query(
      "SELECT * FROM historicalPlayers",
    );
    await Promise.all(
      historicalPlayers.map((player) =>
        connection.query(
          "UPDATE historicalPlayers SET nameAscii=? WHERE uid=?",
          [noAccents(player.name), player.uid],
        ),
      ),
    );
    // Moves the leagues to a new table with the new league id style
    await connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettingsTemp (leagueName varchar(255), newLeagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, leagueID int, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0)",
    );
    await connection.query(
      "INSERT INTO leagueSettingsTemp(leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived) SELECT leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived FROM leagueSettings",
    );
    // Updates the league ids in the other tables
    await Promise.all([
      connection.query(
        "UPDATE users SET favoriteLeague=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=users.favoriteLeague)",
      ),
      connection.query(
        "UPDATE leagueUsers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=leagueUsers.leagueID)",
      ),
      connection.query(
        "UPDATE points SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=points.leagueID)",
      ),
      connection.query(
        "UPDATE transfers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=transfers.leagueID)",
      ),
      connection.query(
        "UPDATE invite SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=invite.leagueID)",
      ),
      connection.query(
        "UPDATE squad SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=squad.leagueID)",
      ),
      connection.query(
        "UPDATE historicalSquad SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=historicalSquad.leagueID)",
      ),
      connection.query(
        "UPDATE historicalTransfers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=historicalTransfers.leagueID)",
      ),
    ]);
    // Moves the leagues back to the original table in the correct form
    await connection.query("DROP TABLE leagueSettings");
    await connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0)",
    );
    await connection.query(
      "INSERT INTO leagueSettings(leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived) SELECT leagueName, newLeagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived FROM leagueSettingsTemp",
    );
    await connection.query("DROP TABLE leagueSettingsTemp");
    oldVersion = "1.9.0";
  }
  if (oldVersion === "1.9.0") {
    console.log("Updating database to version 1.9.1");
    // Checks if the forecast column actually exists because it was removed a long time ago but not actually dropped
    const forecastExists = await connection
      .query(
        "SELECT COUNT(*) AS CNT FROM pragma_table_info('historicalPlayers') WHERE name='forecast'",
      )
      .then((e) => e[0].CNT === 1);
    if (!forecastExists) {
      await connection.query(
        "ALTER TABLE historicalPlayers ADD forecast varchar(1)",
      );
    }
    // Sets all the forecasts for the historical players to attending because they were unknown.
    await connection.query("UPDATE historicalPlayers SET forecast='a'");
    oldVersion = "1.9.1";
  }
  if (oldVersion === "1.9.1") {
    console.log("Updating database to version 1.10.0");
    // Replaces all NA clubs names with empty showing that there is no opponent
    await Promise.all([
      connection.query("UPDATE clubs SET opponent='' WHERE opponent='NA'"),
      connection.query(
        "UPDATE historicalClubs SET opponent='' WHERE opponent='NA'",
      ),
    ]);
    oldVersion = "1.10.0";
  }
  if (oldVersion === "1.10.0") {
    console.log("Updating database to version 1.10.2");
    // Replaces all NA clubs names with empty showing that there is no opponent
    await connection.query(
      "ALTER TABLE leagueSettings ADD matchdayTransfers boolean",
    );
    await connection.query("UPDATE leagueSettings SET matchdayTransfers=0");
    await connection.query(
      "UPDATE leagueSettings SET matchdayTransfers=1 WHERE league='WorldCup2022'",
    );
    oldVersion = "1.10.2";
  }
  if (oldVersion === "1.10.2") {
    console.log("Updating database to version 1.11.0");
    // Adds User Preference saving to the database
    await connection.query("ALTER TABLE users ADD theme varchar(10)");
    await connection.query("ALTER TABLE users ADD locale varchar(5)");
    // Updates the format for the analytics
    const data = await connection.query("SELECT * FROM analytics");
    await Promise.all(
      data.map(
        (e) =>
          new Promise<void>(async (res) => {
            await connection.query(
              "INSERT INTO detailedAnalytics (serverID, day, version, active, total, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                e.serverID,
                e.day,
                e.version,
                e.activeUsers,
                e.users,
                JSON.stringify({
                  Bundesliga: e.BundesligaActive,
                  EPL: e.EPLActive,
                  WorldCup2022: e.WorldCup2022Active,
                }),
                JSON.stringify({
                  Bundesliga: e.Bundesliga,
                  EPL: e.EPL,
                  WorldCup2022: e.WorldCup2022,
                }),
                "{}",
                "{}",
                "{}",
                "{}",
              ],
            );
            res();
          }),
      ),
    );
    // Drops the table for the analytics and creates the correct table.
    await connection.query("DROP TABLE analytics");
    await connection.query(
      "CREATE TABLE IF NOT EXISTS analytics (day int PRIMARY KEY, versionActive varchar(255), versionTotal varchar(255), leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))",
    );
    // Compiles the analytics for every single day that has happened
    const minDate: number = (
      await connection.query("SELECT min(day) AS min FROM detailedAnalytics")
    )[0].min;
    const maxDate: number = (
      await connection.query("SELECT max(day) AS max FROM detailedAnalytics")
    )[0].max;
    for (let i = minDate; i <= maxDate; i++) {
      await compileAnalytics(i);
    }
    await connection.query(
      "ALTER TABLE leagueUsers ADD tutorial bool DEFAULT 1",
    );
    await connection.query("UPDATE leagueUsers SET tutorial=1");
    oldVersion = "1.11.0";
  }
  if (oldVersion === "1.11.0") {
    console.log("Updating database to version 1.12.0");
    // Adds the plugins if they were enabled with then enviromental variables in previous versions
    if (process.env.BUNDESLIGA_API) {
      await connection.query(
        "INSERT IGNORE INTO plugins (name, settings, enabled, url) VALUES ('Bundesliga', ?, 1, 'https://raw.githubusercontent.com/Lukasdotcom/fantasy-manager/main/store/Bundesliga/Bundesliga.json')",
        [JSON.stringify({ access_token: process.env.BUNDESLIGA_API })],
      );
    }
    if (process.env.ENABLE_EPL) {
      await connection.query(
        "INSERT IGNORE INTO plugins (name, settings, enabled, url) VALUES ('EPL','{}', 1, 'https://raw.githubusercontent.com/Lukasdotcom/fantasy-manager/main/store/EPL/EPL.json')",
      );
    }
    // Moves the picture urls to a new table
    await connection.query(
      "CREATE TABLE IF NOT EXISTS pictures2 (url varchar(255))",
    );
    await connection.query("ALTER TABLE players RENAME TO playersTemp");
    await connection.query(
      "CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), nameAscii varchar(255), club varchar(3), pictureID int, value int, sale_price, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool, league varchar(25))",
    );
    await connection.query(
      "ALTER TABLE historicalPlayers RENAME TO historicalPlayersTemp",
    );
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalPlayers (time int, uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureID int, value int, sale_price, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, `exists` bool, league varchar(25))",
    );
    await connection.query(
      "INSERT INTO pictures2 (url) SELECT DISTINCT pictureUrl FROM historicalPlayersTemp",
    );
    await connection.query(
      "INSERT INTO pictures2 (url) SELECT DISTINCT pictureUrl FROM playersTemp",
    );
    await connection.query(
      "INSERT INTO pictures (url) SELECT DISTINCT url FROM pictures2",
    );
    await connection.query("DROP TABLE pictures2");
    await connection.query(
      "INSERT INTO players (uid, name, nameAscii, club, pictureID, value, sale_price, position, forecast, total_points, average_points, last_match, locked, `exists`, league) SELECT uid, name, nameAscii, club, (SELECT id FROM pictures WHERE url=playersTemp.pictureUrl), value, value, position, forecast, total_points, average_points, last_match, locked, `exists`, league FROM playersTemp",
    );
    await connection.query(
      "INSERT INTO historicalPlayers (time, uid, name, nameAscii, club, pictureID, value, sale_price, position, forecast, total_points, average_points, last_match, `exists`, league) SELECT time, uid, name, nameAscii, club, (SELECT id FROM pictures WHERE url=historicalPlayersTemp.pictureUrl), value, value, position, forecast, total_points, average_points, last_match, `exists`, league FROM historicalPlayersTemp",
    );
    await connection.query("DROP TABLE playersTemp");
    await connection.query("DROP TABLE historicalPlayersTemp");
    // Sets the height and width of each picture to what they should be
    await connection.query("UPDATE pictures SET height=200, width=200");
    await connection.query(
      "UPDATE pictures SET height=280, width=220 WHERE url LIKE 'https://resources.premierleague.com/premierleague/photos/players/%'",
    );
    await connection.query(
      "UPDATE pictures SET height=265, width=190 WHERE url LIKE 'https://play.fifa.com/media/image/headshots/%'",
    );
    // Adds the game end and sets it to 4 hours after game start.
    await connection.query("ALTER TABLE clubs ADD gameEnd int");
    await connection.query("UPDATE clubs SET gameEnd=gameStart+14400");
    // Recompiles all analytics due to a samll bug that can occur
    await connection.query("DELETE FROM analytics");
    const minDate: number = (
      await connection.query("SELECT min(day) AS min FROM detailedAnalytics")
    )[0].min;
    const maxDate: number = (
      await connection.query("SELECT max(day) AS max FROM detailedAnalytics")
    )[0].max;
    for (let i = minDate; i <= maxDate; i++) {
      await compileAnalytics(i);
    }
    oldVersion = "1.12.0";
  }
  if (oldVersion === "1.12.0") {
    console.log("Updating database to version 1.13.0");
    if (parseInt(String(process.env.MIN_UPDATE_TIME)) > 0) {
      await connection.query(
        "INSERT INTO data (value1, value2) VALUES ('configMinTimeGame', ?) ON DUPLICATE KEY UPDATE value2=?",
        [process.env.MIN_UPDATE_TIME, process.env.MIN_UPDATE_TIME],
      );
    }
    if (parseInt(String(process.env.MIN_UPDATE_TIME_TRANSFER)) > 0) {
      await connection.query(
        "INSERT INTO data (value1, value2) VALUES ('configMinTimeTransfer', ?) ON DUPLICATE KEY UPDATE value2=?",
        [
          process.env.MIN_UPDATE_TIME_TRANSFER,
          process.env.MIN_UPDATE_TIME_TRANSFER,
        ],
      );
    }
    await connection.query(
      "INSERT INTO data (value1, value2) VALUES ('configMaxTimeGame', '86400'), ('configMaxTimeTransfer', '86400') ON DUPLICATE KEY UPDATE value2='86400'",
    );
    // Fixes bug with previous version that had some historical sale prices at null
    await connection.query(
      "UPDATE historicalPlayers SET sale_price=value WHERE sale_price IS NULL",
    );
    await connection.query(
      "ALTER TABLE pictures ADD downloading bool DEFAULT 0",
    );
    if (process.env.DOWNLOAD_PICTURE) {
      await connection.query(
        "INSERT INTO data (value1, value2) VALUES ('configDownloadPicture', ?) ON DUPLICATE KEY UPDATE value2=?",
        [process.env.DOWNLOAD_PICTURE, process.env.DOWNLOAD_PICTURE],
      );
    }
    oldVersion = "1.13.0";
  }
  if (oldVersion === "1.13.0") {
    console.log("Updating database to version 1.14.0");
    await Promise.all([
      connection.query("ALTER TABLE users ADD inactiveDays int DEFAULT 0"),
      connection.query(
        "ALTER TABLE leagueSettings ADD top11 boolean DEFAULT 0",
      ),
      connection.query("ALTER TABLE leagueSettings ADD active bool DEFAULT 1"),
      connection.query(
        "ALTER TABLE leagueSettings ADD inactiveDays int DEFAULT 0",
      ),
      connection.query(
        "INSERT IGNORE INTO data (value1, value2) VALUES ('configArchiveInactiveLeague', '0')",
      ),
    ]);
    oldVersion = "1.14.0";
  }
  // Normalization definitions got updated
  if (oldVersion === "1.14.0") {
    normalize_db();
    oldVersion = "1.15.0";
  }
  if (oldVersion === "1.15.0") {
    console.log("Updating database to version 1.16.0");
    await connection.query("ALTER TABLE clubs ADD teamScore int");
    await connection.query("ALTER TABLE clubs ADD opponentScore int");
    await connection.query("ALTER TABLE clubs ADD home bool");
    await connection.query("ALTER TABLE clubs ADD `exists` bool");
    const clubList: clubs[] = await connection.query("SELECT club FROM clubs");
    for (const club of clubList) {
      await connection.query(
        "UPDATE clubs AS test SET home=EXISTS (SELECT * FROM clubs WHERE home=1 AND opponent=test.club AND league=test.league) WHERE club=?",
        [club.club],
      );
    }
    await connection.query("UPDATE clubs SET `exists`=1");
    await connection.query("ALTER TABLE historicalClubs ADD teamScore int");
    await connection.query("ALTER TABLE historicalClubs ADD opponentScore ibt");
    await connection.query("ALTER TABLE historicalClubs ADD home bool");
    await connection.query("ALTER TABLE historicalClubs ADD `exists` bool");
    const historicalClubsList: clubs[] = await connection.query(
      "SELECT club FROM historicalClubs",
    );
    for (const club of historicalClubsList) {
      await connection.query(
        "UPDATE historicalClubs AS test SET home=EXISTS (SELECT * FROM historicalClubs WHERE home=1 AND opponent=test.club AND league=test.league) WHERE club=?",
        [club.club],
      );
    }
    await connection.query("UPDATE historicalClubs SET `exists`=1");
    await connection.query(
      "ALTER TABLE leagueUsers ADD fantasyPoints int DEFAULT 0",
    );
    await connection.query(
      "ALTER TABLE leagueUsers ADD predictionPoints int DEFAULT 0",
    );
    await connection.query(
      "UPDATE leagueUsers SET fantasyPoints=points, predictionPoints=0",
    );
    await connection.query(
      "ALTER TABLE leagueSettings RENAME TO leagueSettingsTemp",
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0, matchdayTransfers boolean DEFAULT 0, fantasyEnabled boolean, predictionsEnabled boolean, predictWinner int DEFAULT 2, predictDifference int DEFAULT 5, predictExact int DEFAULT 15, top11 boolean DEFAULT 0, active bool DEFAULT 0, inactiveDays int DEFAULT 0)",
    );
    await connection.query(
      "INSERT INTO leagueSettings (leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived, matchdayTransfers, top11, active, inactiveDays) SELECT leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived, matchdayTransfers, top11, active, inactiveDays FROM leagueSettingsTemp",
    );
    await connection.query(
      "UPDATE leagueSettings SET fantasyEnabled=1, predictionsEnabled=0",
    );
    await connection.query("ALTER TABLE points ADD fantasyPoints int");
    await connection.query("ALTER TABLE points ADD predictionPoints int");
    await connection.query(
      "UPDATE points SET fantasyPoints=points, predictionPoints=0",
    );
    await connection.query("DROP TABLE leagueSettingsTemp");
    await connection.query(
      "ALTER TABLE detailedAnalytics RENAME TO detailedAnalyticsTemp",
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS detailedAnalytics (serverID varchar(255), day int, version varchar(255), active int, total int, leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))",
    );
    await connection.query(
      "INSERT INTO detailedAnalytics (serverID, day, version, active, total, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal) SELECT serverID, day, version, active, total, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal FROM detailedAnalyticsTemp",
    );
    await connection.query("DROP TABLE detailedAnalyticsTemp");
    oldVersion = "1.16.0";
    console.log("Upgraded database to version 1.16.0");
  }
  if (oldVersion === "1.16.0") {
    console.log("Upgrading database to version 1.17.0");
    await connection.query("ALTER TABLE players RENAME TO playersTemp");
    await connection.query(
      "CREATE TABLE IF NOT EXISTS players (uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureID int, value int, sale_price int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool, league varchar(25))",
    );
    await connection.query(
      "INSERT INTO players (uid, name, nameAscii, club, pictureID, value, sale_price, position, forecast, total_points, average_points, last_match, locked, `exists`, league) SELECT uid, name, nameAscii, club, pictureID, value, sale_price, position, forecast, total_points, average_points, last_match, locked, `exists`, league FROM playersTemp",
    );
    await connection.query("DROP TABLE playersTemp");
    await connection.query("ALTER TABLE clubs RENAME TO clubsTemp");
    await connection.query(
      "CREATE TABLE IF NOT EXISTS clubs (club varchar(25), gameStart int, gameEnd int, opponent varchar(3), teamScore int, opponentScore int, league varchar(25), home bool, `exists` bool, PRIMARY KEY(club, league))",
    );
    await connection.query(
      "INSERT IGNORE INTO clubs (club, gameStart, gameEnd, opponent, teamScore, opponentScore, league, home, `exists`) SELECT club, gameStart, gameEnd, opponent, teamScore, opponentScore, league, home, `exists` FROM clubsTemp",
    );
    await connection.query("DROP TABLE clubsTemp");
    await connection.query(
      "ALTER TABLE historicalClubs RENAME TO historicalClubsTemp",
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS historicalClubs (club varchar(25), opponent varchar(3), teamScore int, opponentScore int, league varchar(25), home bool, time int, `exists` bool, PRIMARY KEY(club, league, time))",
    );
    await connection.query(
      "INSERT INTO historicalClubs (club, opponent, teamScore, opponentScore, league, home, time, `exists`) SELECT club, opponent, teamScore, opponentScore, league, home, time, `exists` FROM historicalClubsTemp",
    );
    await connection.query("DROP TABLE historicalClubsTemp");
    oldVersion = "1.17.0";
    console.log("Upgraded database to version 1.17.0");
  }
  if (oldVersion === "1.17.0") {
    console.log("Upgrading database to version 1.18.0");
    // Fixes because historicalClub data was archived incorrectly
    await connection.query(
      "UPDATE historicalClubs AS test SET home=EXISTS (SELECT * FROM historicalClubs WHERE home=0 AND opponent=test.club AND league=test.league AND time=test.time)",
    );
    await connection.query(
      "UPDATE historicalClubs SET `exists`=EXISTS (SELECT * FROM historicalPlayers WHERE `exists`=1 AND club=historicalClubs.club AND league=historicalClubs.league AND time=historicalClubs.time)",
    );
    oldVersion = "1.18.0";
    console.log("Upgraded database to version 1.18.0");
  }
  if (oldVersion === "1.18.0") {
    console.log("Upgrading database to version 1.18.1");
    // Fix for leagueSettings table not having default values set for fantasyEnabled and predictionsEnabled
    await connection.query(
      "ALTER TABLE leagueSettings RENAME TO leagueSettingsTemp",
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0, matchdayTransfers boolean DEFAULT 0, fantasyEnabled boolean DEFAULT 1, predictionsEnabled boolean DEFAULT 1, predictWinner int DEFAULT 2, predictDifference int DEFAULT 5, predictExact int DEFAULT 15, top11 boolean DEFAULT 0, active bool DEFAULT 0, inactiveDays int DEFAULT 0)",
    );
    await connection.query(
      "INSERT INTO leagueSettings SELECT * FROM leagueSettingsTemp",
    );
    await connection.query(
      "UPDATE leagueSettings SET fantasyEnabled=0 WHERE fantasyEnabled IS NULL",
    );
    await connection.query(
      "UPDATE leagueSettings SET predictionsEnabled=0 WHERE predictionsEnabled IS NULL",
    );
    await connection.query("DROP TABLE leagueSettingsTemp");
    // Fixes some invalid time=0s for the points table
    await connection.query("UPDATE points SET time=NULL WHERE time=0");
    oldVersion = "1.18.1";
    console.log("Upgraded database to version 1.18.1");
  }
  if (oldVersion === "1.18.1") {
    console.log("Upgrading database to version 1.19.0");
    // Adds club full names to tables
    await connection.query(
      "ALTER TABLE historicalClubs ADD fullName varchar(255)",
    );
    await connection.query("ALTER TABLE clubs ADD fullName varchar(255)");
    oldVersion = "1.19.0";
    console.log("Upgraded database to version 1.19.0");
  }
  connection.end();
  return oldVersion;
}
