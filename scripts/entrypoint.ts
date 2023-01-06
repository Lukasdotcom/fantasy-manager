import connect, {
  analytics,
  data,
  detailedAnalytics,
  leagues,
} from "../Modules/database";
import { updateData } from "./update";
import version from "./../package.json";
import dotenv from "dotenv";
import { unlink } from "fs";
import noAccents from "../Modules/normalize";
if (process.env.APP_ENV !== "test") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config({ path: ".env.test.local" });
}
const analyticsDomain = "https://fantasy.lschaefer.xyz";
// Used to tell the program what version of the database to use
const currentVersion = "1.11.0";
const date = new Date();
let day = date.getDay();
//JSDocs
/**
 * Turns the days of the analytics in the db into one entry in the final analytics table
 *
 * @param day The day of the week that should be compiled
 *
 */
async function compileAnalytics(day: number) {
  const connection = await connect();
  const analytics: detailedAnalytics[] = await connection.query(
    "SELECT * FROM detailedAnalytics WHERE day = ?",
    [day]
  );
  const previousAnalytics: analytics[] = await connection.query(
    "SELECT * FROM analytics WHERE day = ?",
    [day - 1]
  );
  type analyticsData = { [key: string]: number };
  let versionActive: analyticsData = {};
  let versionTotal: analyticsData = {};
  let leagueActive: analyticsData = {};
  let leagueTotal: analyticsData = {};
  let themeActive: analyticsData = {};
  let themeTotal: analyticsData = {};
  let localeActive: analyticsData = {};
  let localeTotal: analyticsData = {};
  // Makes sure the dictionaries for the analytics are prefilled with all required information
  if (previousAnalytics.length > 0) {
    const previousEntry = previousAnalytics[0];
    versionActive = JSON.parse(previousEntry.versionActive);
    for (const version in versionActive) {
      versionActive[version] = 0;
    }
    versionTotal = JSON.parse(previousEntry.versionTotal);
    for (const version in versionTotal) {
      versionTotal[version] = 0;
    }
    leagueActive = JSON.parse(previousEntry.leagueActive);
    for (const league in leagueActive) {
      leagueActive[league] = 0;
    }
    leagueTotal = JSON.parse(previousEntry.leagueTotal);
    for (const league in leagueTotal) {
      leagueTotal[league] = 0;
    }
    themeActive = JSON.parse(previousEntry.themeActive);
    for (const theme in themeActive) {
      themeActive[theme] = 0;
    }
    themeTotal = JSON.parse(previousEntry.themeTotal);
    for (const theme in themeTotal) {
      themeTotal[theme] = 0;
    }
    localeActive = JSON.parse(previousEntry.localeActive);
    for (const locale in localeActive) {
      localeActive[locale] = 0;
    }
    localeTotal = JSON.parse(previousEntry.localeTotal);
    for (const locale in localeTotal) {
      localeTotal[locale] = 0;
    }
  }
  // Goes through every servers analytics and adds them to the dictionaries
  for (const entry of analytics) {
    if (versionActive[entry.version] === undefined) {
      versionActive[entry.version] = 0;
    }
    versionActive[entry.version] += entry.active;
    if (versionTotal[entry.version] === undefined) {
      versionTotal[entry.version] = 0;
    }
    versionTotal[entry.version] += entry.total;
    const leagueActiveEntry: analyticsData = JSON.parse(entry.leagueActive);
    for (const league in leagueActiveEntry) {
      if (leagueActive[league] === undefined) {
        leagueActive[league] = 0;
      }
      leagueActive[league] += leagueActiveEntry[league];
    }
    const leagueTotalEntry = JSON.parse(entry.leagueTotal);
    for (const league in leagueTotalEntry) {
      if (leagueTotal[league] === undefined) {
        leagueTotal[league] = 0;
      }
      leagueTotal[league] += leagueTotalEntry[league];
    }
    const themeActiveEntry = JSON.parse(entry.themeActive);
    for (const theme in themeActiveEntry) {
      if (themeActive[theme] === undefined) {
        themeActive[theme] = 0;
      }
      themeActive[theme] += themeActiveEntry[theme];
    }
    const themeTotalEntry = JSON.parse(entry.themeTotal);
    for (const theme in themeTotalEntry) {
      if (themeTotal[theme] === undefined) {
        themeTotal[theme] = 0;
      }
      themeTotal[theme] += themeTotalEntry[theme];
    }
    const localeActiveEntry = JSON.parse(entry.localeActive);
    for (const locale in localeActiveEntry) {
      if (localeActive[locale] === undefined) {
        localeActive[locale] = 0;
      }
      localeActive[locale] += localeActiveEntry[locale];
    }
    const localeTotalEntry = JSON.parse(entry.localeTotal);
    for (const locale in localeTotalEntry) {
      if (localeTotal[locale] === undefined) {
        localeTotal[locale] = 0;
      }
      localeTotal[locale] += localeTotalEntry[locale];
    }
  }
  await connection.query("DELETE FROM analytics WHERE day = ?", [day]);
  await connection.query(
    "INSERT INTO analytics (day, versionActive, versionTotal, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      day,
      JSON.stringify(versionActive),
      JSON.stringify(versionTotal),
      JSON.stringify(leagueActive),
      JSON.stringify(leagueTotal),
      JSON.stringify(themeActive),
      JSON.stringify(themeTotal),
      JSON.stringify(localeActive),
      JSON.stringify(localeTotal),
    ]
  );
  await connection.end();
}

async function startUp() {
  if (process.env.APP_ENV === "test") {
    await new Promise<void>((res) => {
      // Makes sure that the sqlite file is defined
      if (process.env.SQLITE === undefined) {
        res();
        return;
      }
      unlink(process.env.SQLITE, () => {
        res();
      });
    });
  }
  const connection = await connect();
  await Promise.all([
    // Used to store the users
    connection.query(
      "CREATE TABLE IF NOT EXISTS users (id int PRIMARY KEY AUTO_INCREMENT NOT NULL, username varchar(255), password varchar(60), throttle int DEFAULT 30, active bool DEFAULT 0, google varchar(255) DEFAULT '', github varchar(255) DEFAULT '', admin bool DEFAULT false, favoriteLeague int, theme varchar(10), locale varchar(5))"
    ),
    // Used to store the players data
    connection.query(
      "CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), nameAscii varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool, league varchar(25))"
    ),
    // Creates a table that contains some key value pairs for data that is needed for some things
    connection.query(
      "CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))"
    ),
    // Used to store the leagues settings
    connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0, matchdayTransfers boolean)"
    ),
    // Used to store the leagues users
    connection.query(
      "CREATE TABLE IF NOT EXISTS leagueUsers (leagueID int, user int, points int, money int, formation varchar(255), admin bool DEFAULT 0)"
    ),
    // Used to store the Historical Points
    connection.query(
      "CREATE TABLE IF NOT EXISTS points (leagueID int, user int, points int, matchday int, money int, time int)"
    ),
    // Used to store transfers
    connection.query(
      "CREATE TABLE IF NOT EXISTS transfers (leagueID int, seller int, buyer int, playeruid varchar(25), value int, position varchar(5) DEFAULT 'bench', starred bool DEFAULT 0, max int)"
    ),
    // Used to store invite links
    connection.query(
      "CREATE TABLE IF NOT EXISTS invite (inviteID varchar(25) PRIMARY KEY, leagueID int)"
    ),
    // Used to store player squads
    connection.query(
      "CREATE TABLE IF NOT EXISTS squad (leagueID int, user int, playeruid varchar(25), position varchar(5), starred bool DEFAULT 0)"
    ),
    // Used to store historical squads
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalSquad (matchday int, leagueID int, user int, playeruid varchar(25), position varchar(5), starred bool DEFAULT 0)"
    ),
    // Used to store historical player data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalPlayers (time int, uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, `exists` bool, league varchar(25))"
    ),
    // Used to store historical transfer data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalTransfers (matchday int, leagueID int, seller int, buyer int, playeruid varchar(25), value int)"
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS clubs (club varchar(3) PRIMARY KEY, gameStart int, opponent varchar(3), league varchar(25))"
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalClubs (club varchar(3), opponent varchar(3), league varchar(25), time int)"
    ),
    // Used to store analytics data
    connection.query(
      "CREATE TABLE IF NOT EXISTS analytics (day int PRIMARY KEY, versionActive varchar(255), versionTotal varchar(255), leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))"
    ),
    // Used to store every server's analytics data
    connection.query(
      "CREATE TABLE IF NOT EXISTS detailedAnalytics (serverID int, day int, version varchar(255), active int, total int, leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))"
    ),
    // Used to store league announcements
    connection.query(
      "CREATE TABLE IF NOT EXISTS announcements (leagueID int, priority varchar(10) check(priority = 'error' or priority = 'info' or priority = 'success' or priority='warning'), title varchar(255), description varchar(255))"
    ),
  ]);
  // Checks if the server hash has been created and if not makes one
  await connection.query(
    "INSERT IGNORE INTO data (value1, value2) VALUES ('serverID', ?)",
    [String(Math.random() * 8980989890)]
  );
  // Unlocks the database
  leagues.forEach((e) => {
    connection.query("DELETE FROM data WHERE value1=?", ["locked" + e]);
  });
  // Checks the version of the database is out of date
  let getOldVersion: data[] = await connection.query(
    "SELECT value2 FROM data WHERE value1='version'"
  );
  let oldVersion = "";
  if (getOldVersion.length > 0) {
    oldVersion = getOldVersion[0].value2;
    if (oldVersion == "0.1.1") {
      console.log(
        "This version does not have a supported upgrade path to 1.*.*. Due to only me using this program in these versions."
      );
    }
    if (oldVersion == "1.0.0") {
      console.log("Updating database to version 1.0.7");
      // Moves all of the old league data into the new format
      const leagues = await connection.query("SELECT * FROM leagues");
      leagues.forEach((e) => {
        connection.query(
          "INSERT IGNORE INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)",
          [e.leagueName, e.leagueID]
        );
        connection.query(
          "INSERT INTO leagueUsers (leagueID, user, points, money, formation) VALUES (?, ?, ?, ?, ?)",
          [e.leagueID, e.user, e.points, e.money, e.formation]
        );
      });
      connection.query("DROP TABLE leagues");
      oldVersion = "1.0.7";
    }
    if (oldVersion == "1.0.7") {
      console.log("Updating database to version 1.1.0");
      connection.query(
        "ALTER TABLE leagueSettings ADD startMoney int DEFAULT 150000000"
      );
      connection.query(
        "ALTER TABLE leagueSettings ADD transfers int DEFAULT 6"
      );
      connection.query(
        "ALTER TABLE leagueSettings ADD duplicatePlayers int DEFAULT 1"
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
          "ALTER TABLE historicalSquad ADD starred bool DEFAULT 0"
        ),
        connection.query(
          "ALTER TABLE leagueSettings ADD starredPercentage int DEFAULT 150"
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
          "ALTER TABLE historicalPlayers ADD nameAscii varchar(255)"
        ),
      ]);
      let players = await connection.query("SELECT * FROM players");
      players.forEach((e) => {
        connection.query("UPDATE players SET nameAscii=? WHERE uid=?", [
          noAccents(e.name),
          e.uid,
        ]);
      });
      let historicalPlayers = await connection.query(
        "SELECT * FROM historicalPlayers"
      );
      historicalPlayers.forEach((e) => {
        connection.query(
          "UPDATE historicalPlayers SET nameAscii=? WHERE uid=?",
          [noAccents(e.name), e.uid]
        );
      });
      oldVersion = "1.3.1";
    }
    if (oldVersion == "1.3.1") {
      console.log("Updating database to version 1.4.3");
      await connection.query(
        "ALTER TABLE transfers ADD position varchar(5) DEFAULT 'bench'"
      );
      await connection.query(
        "ALTER TABLE transfers ADD starred bool DEFAULT 0"
      );
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
        "ALTER TABLE users ADD google varchar(255) DEFAULT ''"
      );
      await connection.query(
        "ALTER TABLE users ADD github varchar(255) DEFAULT ''"
      );
      await connection.query(
        "UPDATE users SET google=users.email, github=users.email"
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
        connection.query(
          "ALTER TABLE historicalPlayers ADD league varchar(25)"
        ),
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
          "UPDATE data SET value1='updateBundesliga' WHERE value1='update'"
        ),
        connection.query(
          "UPDATE data SET value1='transferOpenBundesliga' WHERE value1='transferOpen'"
        ),
        connection.query(
          "UPDATE data SET value1='playerUpdateBundesliga' WHERE value1='playerUpdate'"
        ),
        connection.query(
          "UPDATE data SET value1='countdownBundesliga' WHERE value1='countdown'"
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
        "UPDATE analytics SET Bundesliga=0, BundesligaActive=0, EPL=0, EPLACTIVE=0"
      );
      oldVersion = "1.8.0";
    }
    if (oldVersion == "1.8.0") {
      console.log("Updating database to version 1.9.0");
      // Adds the new columns to the analytics and the leagueSettings table
      await Promise.all([
        connection.query("ALTER TABLE analytics ADD WorldCup2022 int"),
        connection.query("ALTER TABLE analytics ADD WorldCup2022Active int"),
        connection.query(
          "ALTER TABLE leagueSettings ADD archived int DEFAULT 0"
        ),
      ]);
      await Promise.all([
        connection.query(
          "UPDATE analytics SET WorldCup2022=0, WorldCup2022Active=0"
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
          ])
        )
      );
      // Fixes all the player data to have the correct historical ascii name
      const historicalPlayers = await connection.query(
        "SELECT * FROM historicalPlayers"
      );
      await Promise.all(
        historicalPlayers.map((player) =>
          connection.query(
            "UPDATE historicalPlayers SET nameAscii=? WHERE uid=?",
            [noAccents(player.name), player.uid]
          )
        )
      );
      // Moves the leagues to a new table with the new league id style
      await connection.query(
        "CREATE TABLE IF NOT EXISTS leagueSettingsTemp (leagueName varchar(255), newLeagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, leagueID int, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0)"
      );
      await connection.query(
        "INSERT INTO leagueSettingsTemp(leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived) SELECT leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived FROM leagueSettings"
      );
      // Updates the league ids in the other tables
      await Promise.all([
        connection.query(
          "UPDATE users SET favoriteLeague=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=users.favoriteLeague)"
        ),
        connection.query(
          "UPDATE leagueUsers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=leagueUsers.leagueID)"
        ),
        connection.query(
          "UPDATE points SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=points.leagueID)"
        ),
        connection.query(
          "UPDATE transfers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=transfers.leagueID)"
        ),
        connection.query(
          "UPDATE invite SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=invite.leagueID)"
        ),
        connection.query(
          "UPDATE squad SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=squad.leagueID)"
        ),
        connection.query(
          "UPDATE historicalSquad SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=historicalSquad.leagueID)"
        ),
        connection.query(
          "UPDATE historicalTransfers SET leagueID=(SELECT newLeagueID FROM leagueSettingsTemp WHERE leagueID=historicalTransfers.leagueID)"
        ),
      ]);
      // Moves the leagues back to the original table in the correct form
      await connection.query("DROP TABLE leagueSettings");
      await connection.query(
        "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0)"
      );
      await connection.query(
        "INSERT INTO leagueSettings(leagueName, leagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived) SELECT leagueName, newLeagueID, startMoney, transfers, duplicatePlayers, starredPercentage, league, archived FROM leagueSettingsTemp"
      );
      await connection.query("DROP TABLE leagueSettingsTemp");
      oldVersion = "1.9.0";
    }
    if (oldVersion === "1.9.0") {
      console.log("Updating database to version 1.9.1");
      // Checks if the forecast column actually exists because it was removed a long time ago but not actually dropped
      const forecastExists = await connection
        .query(
          "SELECT COUNT(*) AS CNT FROM pragma_table_info('historicalPlayers') WHERE name='forecast'"
        )
        .then((e) => e[0].CNT === 1);
      if (!forecastExists) {
        await connection.query(
          "ALTER TABLE historicalPlayers ADD forecast varchar(1)"
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
          "UPDATE historicalClubs SET opponent='' WHERE opponent='NA'"
        ),
      ]);
      oldVersion = "1.10.0";
    }
    if (oldVersion === "1.10.0") {
      console.log("Updating database to version 1.10.2");
      // Replaces all NA clubs names with empty showing that there is no opponent
      await connection.query(
        "ALTER TABLE leagueSettings ADD matchdayTransfers boolean"
      );
      await connection.query("UPDATE leagueSettings SET matchdayTransfers=0");
      await connection.query(
        "UPDATE leagueSettings SET matchdayTransfers=1 WHERE league='WorldCup2022'"
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
                    ELP: e.EPLActive,
                    WorldCup2022: e.WorldCup2022Active,
                  }),
                  JSON.stringify({
                    Bundesliga: e.Bundesliga,
                    ELP: e.EPL,
                    WorldCup2022: e.WorldCup2022,
                  }),
                  "{}",
                  "{}",
                  "{}",
                  "{}",
                ]
              );
              res();
            })
        )
      );
      // Drops the table for the analytics and creates the correct table.
      await connection.query("DROP TABLE analytics");
      await connection.query(
        "CREATE TABLE IF NOT EXISTS analytics (day int PRIMARY KEY, versionActive varchar(255), versionTotal varchar(255), leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))"
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
      oldVersion = "1.11.0";
    }
    // HERE IS WHERE THE CODE GOES TO UPDATE THE DATABASE FROM ONE VERSION TO THE NEXT
    // Makes sure that the database is up to date
    if (oldVersion !== currentVersion) {
      console.error("Database is corrupted or is too old");
    }
  }
  // Makes sure that the admin user is the correct user
  await connection.query("UPDATE users SET admin=0");
  if (process.env.ADMIN !== undefined) {
    const adminUser = parseInt(process.env.ADMIN);
    console.log(`User ${adminUser} is the admin user`);
    connection.query("UPDATE users SET admin=1 WHERE id=?", [adminUser]);
  } else {
    console.log("Admin user is disabled");
  }
  // Updated version of database in table
  connection.query(
    "INSERT INTO data (value1, value2) VALUES('version', ?) ON DUPLICATE KEY UPDATE value2=?",
    [currentVersion, currentVersion]
  );
  connection.end();
  // Makes sure to check if an update is neccessary every 10 seconds
  setInterval(update, 10000);
  leagues.forEach((e) => {
    updateData(e);
  });
}
startUp();
async function update() {
  const connection3 = await connect();
  // Increases the throttle attempts left by 1
  connection3.query("UPDATE users SET throttle=throttle+1 WHERE throttle<30");
  const newDate = new Date();
  // Checks if a new day is happening
  if (day != newDate.getDay()) {
    day = newDate.getDay();
    // Gathers the analytics data
    const users = await connection3.query("SELECT * FROM users");
    let localeActive: { [Key: string]: number } = {};
    let localeTotal: { [Key: string]: number } = {};
    let themeActive: { [Key: string]: number } = {};
    let themeTotal: { [Key: string]: number } = {};
    for (const user of users) {
      if (user.locale !== "" && user.locale) {
        // Calculates all the locales for the users
        if (user.locale in localeTotal) {
          localeTotal[user.locale]++;
        } else {
          localeTotal[user.locale] = 1;
        }
        if (user.active) {
          if (user.locale in localeActive) {
            localeActive[user.locale]++;
          } else {
            localeActive[user.locale] = 1;
          }
        }
      }
      if (user.theme !== "" && user.theme) {
        // Calculates all the themes for the users
        if (user.theme in themeTotal) {
          themeTotal[user.theme]++;
        } else {
          themeTotal[user.theme] = 1;
        }
        if (user.active) {
          if (user.theme in themeActive) {
            themeActive[user.theme]++;
          } else {
            themeActive[user.theme] = 1;
          }
        }
      }
    }
    // Gets all the statistics for the leagues
    let leagueActive: { [Key: string]: number } = {};
    let leagueTotal: { [Key: string]: number } = {};
    for (const league of leagues) {
      // Calculates all the leagues for the users
      leagueActive[league] = (
        await connection3.query(
          "SELECT * FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND leagueSettings.archived=0) AND EXISTS (SELECT * FROM users WHERE users.id=leagueUsers.user AND active='1')",
          [league]
        )
      ).length;
      leagueTotal[league] = (
        await connection3.query(
          "SELECT * FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND leagueSettings.archived=0)",
          [league]
        )
      ).length;
    }
    const JSONbody = JSON.stringify({
      serverID: await connection3
        .query("SELECT value2 FROM data WHERE value1='serverID'")
        .then((res) => res[0].value2),
      total: users.length,
      active: users.filter((e) => e.active).length,
      version: version.version,
      leagueActive: JSON.stringify(leagueActive),
      leagueTotal: JSON.stringify(leagueTotal),
      themeActive: JSON.stringify(themeActive),
      themeTotal: JSON.stringify(themeTotal),
      localeActive: JSON.stringify(localeActive),
      localeTotal: JSON.stringify(localeTotal),
    });
    if (
      process.env.APP_ENV !== "development" &&
      process.env.APP_ENV !== "test"
    ) {
      // Sends the analytics data to the analytics server
      fetch(`${analyticsDomain}/api/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONbody,
      }).catch(() => {});
    }
    // Sends the analytics data to the server
    fetch(`http://localhost:3000/api/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONbody,
    });
    connection3.query("UPDATE users SET active=0");
    // Has the analytics get compiled for all days that have happened since this day
    const lastDay = await connection3.query(
      "SELECT max(day) AS max FROM analytics"
    );
    if (lastDay.length > 0) {
      let max = lastDay[0].max;
      while (max < day - 1) {
        compileAnalytics(max);
        max++;
      }
    }
    compileAnalytics(day - 1);
    console.log("Downloading new data for today");
    // Updates every single league
    leagues.forEach((e) => {
      updateData(e);
    });
    // Checks if an update was requested
  } else {
    leagues.forEach(async (e) => {
      if (
        (
          await connection3.query(
            "SELECT * FROM data WHERE value1=? and value2='1'",
            ["update" + e]
          )
        ).length > 0
      ) {
        console.log(`Updating data for ${e} now`);
        updateData(e);
      }
    });
  }
  // Goes through every league and does stuff for them
  await Promise.all(
    leagues.map((e) => {
      return new Promise(async (res) => {
        connection3.query(
          "INSERT INTO data (value1, value2) VALUES(?, '0') ON DUPLICATE KEY UPDATE value2=0",
          ["update" + e]
        );
        // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
        const countdown = await connection3.query(
          "SELECT value2 FROM data WHERE value1=?",
          ["countdown" + e]
        );
        const transferOpen = await connection3
          .query("SELECT value2 FROM data WHERE value1=?", ["transferOpen" + e])
          .then((res: data[]) =>
            res.length > 0 ? res[0].value2 === "true" : false
          );
        if (countdown.length > 0) {
          const time = countdown[0].value2;
          // Updates the countdown
          if (transferOpen) {
            if (time - 11 > 0) {
              connection3.query("UPDATE data SET value2=? WHERE value1=?", [
                time - 10,
                "countdown" + e,
              ]);
            } else {
              // Makes sure that the amount of time left in the transfer is not unknown
              if (time > 0) {
                console.log(
                  `Predicting start of matchday in ${time} seconds for ${e}`
                );
                // Makes sure to wait until the time is done
                setTimeout(() => {
                  updateData(e);
                }, time * 1000 + 1);
                connection3.query("UPDATE data SET value2=? WHERE value1=?", [
                  time - 10,
                  "countdown" + e,
                ]);
              }
            }
          } else {
            if (time - 11 > 0) {
              connection3.query("UPDATE data SET value2=? WHERE value1=?", [
                time - 10,
                "countdown" + e,
              ]);
            } else {
              // Makes sure that the amount of time left in the matchday is not unknown
              if (time > 0) {
                console.log(
                  `Predicting end of matchday in ${time} seconds for ${e}`
                );
                setTimeout(() => {
                  updateData(e);
                }, time * 1000 + 1);
                connection3.query("UPDATE data SET value2=? WHERE value1=?", [
                  time - 10,
                  "countdown" + e,
                ]);
              }
            }
          }
        }
        res(1);
      });
    })
  );
  // Updates the latest update check value
  connection3.query(
    "INSERT INTO data (value1, value2) VALUES('lastUpdateCheck', ?) ON DUPLICATE KEY UPDATE value2=?",
    [
      String(Math.floor(Date.now() / 1000)),
      String(Math.floor(Date.now() / 1000)),
    ]
  );
  connection3.end();
}
