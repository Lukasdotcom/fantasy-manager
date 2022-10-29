import connect, { data, leagues } from "../Modules/database";
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
const analyticsDomain = "https://bundesliga.lschaefer.xyz";
// Used to tell the program what version of the database to use
const currentVersion = "1.8.0";
const date = new Date();
let day = date.getDay();

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
      "CREATE TABLE IF NOT EXISTS users (id int PRIMARY KEY AUTO_INCREMENT NOT NULL, username varchar(255), password varchar(60), throttle int DEFAULT 30, active bool DEFAULT 0, google varchar(255) DEFAULT '', github varchar(255) DEFAULT '', admin bool DEFAULT false, favoriteLeague int)"
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
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25))"
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
      "CREATE TABLE IF NOT EXISTS historicalPlayers (time int, uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), total_points int, average_points int, last_match int, `exists` bool, league varchar(25))"
    ),
    // Used to store historical transfer data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalTransfers (matchday int, leagueID int, seller int, buyer int, playeruid varchar(25), value int)"
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS clubs (club varchar(3) PRIMARY KEY, gameStart int, opponent varchar(3), league varchar(25))"
    ),
    // Used to store analytics data
    connection.query(
      "CREATE TABLE IF NOT EXISTS analytics (serverID varchar(10), day int, version varchar(10), users int, activeUsers int)"
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
      oldVersion = "1.8.0";
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
    const JSONbody = JSON.stringify({
      serverID: await connection3
        .query("SELECT value2 FROM data WHERE value1='serverID'")
        .then((res) => res[0].value2),
      users: users.length,
      activeUsers: users.filter((e) => e.active).length,
      version: version.version,
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
  leagues.forEach(async (e) => {
    const connection4 = await connect();
    connection4.query(
      "INSERT INTO data (value1, value2) VALUES(?, '0') ON DUPLICATE KEY UPDATE value2=0",
      ["update" + e]
    );
    // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
    const countdown = await connection4.query(
      "SELECT value2 FROM data WHERE value1=?",
      ["countdown" + e]
    );
    const transferOpen = await connection4
      .query("SELECT value2 FROM data WHERE value1=?", ["transferOpen" + e])
      .then((res: data[]) =>
        res.length > 0 ? res[0].value2 === "true" : false
      );
    if (countdown.length > 0) {
      const time = countdown[0].value2;
      // Updates the countdown
      if (transferOpen) {
        if (time - 11 > 0) {
          connection4.query("UPDATE data SET value2=? WHERE value1=?", [
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
            connection4.query("UPDATE data SET value2=? WHERE value1=?", [
              time - 10,
              "countdown" + e,
            ]);
          }
        }
      } else {
        if (time - 11 > 0) {
          connection4.query("UPDATE data SET value2=? WHERE value1=?", [
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
            connection4.query("UPDATE data SET value2=? WHERE value1=?", [
              time - 10,
              "countdown" + e,
            ]);
          }
        }
      }
    }
    connection4.end();
  });
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
