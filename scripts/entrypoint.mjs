import connect from "../Modules/database.mjs";
import { checkUpdate, updateData } from "./update.mjs";
import version from "./../package.json" assert { type: "json" };
import dotenv from "dotenv";
import { unlink } from "fs";
import noAccents from "../Modules/normalize.mjs";
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config({ path: ".env.test.local" });
}
// Used to tell the program what version of the database to use
const currentVersion = "1.3.1";
const date = new Date();
let day = date.getDay();

async function startUp() {
  if (process.env.NODE_ENV === "test") {
    await new Promise((res) => {
      unlink(process.env.SQLITE, function () {
        res();
      });
    });
  }
  const connection = await connect();
  await Promise.all([
    // Used to store the users
    connection.query(
      "CREATE TABLE IF NOT EXISTS users (id int PRIMARY KEY AUTO_INCREMENT NOT NULL, email varchar(255), username varchar(255), password varchar(60))"
    ),
    // Used to store the players data
    connection.query(
      "CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), nameAscii varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool)"
    ),
    // Creates a table that contains some key value pairs for data that is needed for some things
    connection.query(
      "CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))"
    ),
    // Used to store the leagues settings
    connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150)"
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
      "CREATE TABLE IF NOT EXISTS transfers (leagueID int, seller int, buyer int, playeruid varchar(25), value int)"
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
      "CREATE TABLE IF NOT EXISTS historicalPlayers (time int, uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, `exists` bool)"
    ),
    // Used to store historical transfer data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalTransfers (matchday int, leagueID int, seller int, buyer int, playeruid varchar(25), value int)"
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS clubs (club varchar(3) PRIMARY KEY, gameStart int, opponent varchar(3))"
    ),
  ]);
  // Unlocks the database
  connection.query("DELETE FROM data WHERE value1='locked'");
  // Checks the version of the database is out of date
  let oldVersion = await connection.query(
    "SELECT value2 FROM data WHERE value1='version'"
  );
  if (oldVersion.length > 0) {
    oldVersion = oldVersion[0].value2;
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
    // HERE IS WHERE THE CODE GOES TO UPDATE THE DATABASE FROM ONE VERSION TO THE NEXT
    // Makes sure that the database is up to date
    if (oldVersion !== currentVersion) {
      console.error("Database is corrupted or is too old");
    }
  }
  // Updated version of database in table
  connection.query(
    "INSERT INTO data (value1, value2) VALUES('version', ?) ON DUPLICATE KEY UPDATE value2=?",
    [currentVersion, currentVersion]
  );
  connection.end();
  // Makes sure to check if an update is neccessary every 10 seconds
  setInterval(update, 10000);
  updateData();
  // Checks if this is the latest version and if it does adds data
  async function updateInfo() {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      console.log("Skipping update check due to being development enviroment");
      return;
    }
    console.log("Checking for updates");
    const releases = await fetch(
      "https://api.github.com/repos/lukasdotcom/Bundesliga/releases"
    ).then((res) => (res.ok ? res.json() : {}));
    if (releases[0] === undefined || releases[0].tag_name === undefined) {
      console.log("Failed to get version data from github api");
      return;
    }
    const connection2 = await connect();
    if (version.version !== releases[0].tag_name) {
      connection2.query(
        "INSERT INTO data (value1, value2) VALUES('updateProgram', ?) ON DUPLICATE KEY UPDATE value2=?",
        [releases[0].html_url, releases[0].html_url]
      );
    } else {
      connection2.query("DELETE FROM data WHERE value1='updateProgram'");
    }
    connection2.end();
  }
  updateInfo();
  setInterval(updateInfo, 3600000 * 24);
}
startUp();
async function update() {
  const connection3 = await connect();
  const newDate = new Date();
  // Checks if a new day is happening
  if (day != newDate.getDay()) {
    day = newDate.getDay();
    console.log("Downloading new data for today");
    updateData();
    // Checks if an update was requested
  } else if (
    (
      await connection3.query(
        "SELECT * FROM data WHERE value1='update' and value2='1'"
      )
    ).length > 0
  ) {
    console.log("Updating data now");
    updateData();
  }
  connection3.query(
    "INSERT INTO data (value1, value2) VALUES('update', '0') ON DUPLICATE KEY UPDATE value2=0"
  );
  // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
  const countdown = await connection3.query(
    "SELECT value2 FROM data WHERE value1='countdown'"
  );
  const transferOpen =
    (await connection3.query(
      "SELECT value2 FROM data WHERE value1='transferOpen'"
    )) === "true";
  if (countdown.length > 0) {
    const time = countdown[0].value2;
    // Updates the countdown
    if (transferOpen) {
      if (time - 11 > 0) {
        connection3.query("UPDATE data SET value2=? WHERE value1='countdown'", [
          time - 10,
        ]);
      } else {
        // Makes sure that the amount of time left in the transfer is not unknown
        if (time != 0) {
          console.log(`Predicting start of matchday in ${time} seconds`);
          // Makes sure to wait until the time is done
          setTimeout(updateData, time * 1000 + 1);
        }
      }
    } else {
      if (time - 11 > 0) {
        // If there is about an hour left an update is requested
        if (time - 3600 < 11) {
          checkUpdate();
        }
        connection3.query("UPDATE data SET value2=? WHERE value1='countdown'", [
          time - 10,
        ]);
      } else {
        // Makes sure that the amount of time left in the matchday is not unknown
        if (time != 0) {
          console.log(`Predicting end of matchday in ${time} seconds`);
          setTimeout(updateData, time * 1000 + 1);
        }
      }
    }
  }
  // Updates the latest update check value
  connection3.query(
    "INSERT INTO data (value1, value2) VALUES('lastUpdateCheck', ?) ON DUPLICATE KEY UPDATE value2=?",
    [String(parseInt(Date.now() / 1000)), String(parseInt(Date.now() / 1000))]
  );
  connection3.end();
}
