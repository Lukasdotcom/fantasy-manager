import { createConnection } from "mysql";
import { updateData } from "./update.mjs";
import version from "./../package.json" assert { type: "json" };
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// Used to tell the program what version of the database to use
const currentVersion = "1.1.0";
let date = new Date();
var day = date.getDay();

async function startUp() {
  // Waits unitl the sql server is ready
  let error = true;
  while (error) {
    error = await new Promise((res) => {
      setTimeout(() => {
        const connection = createConnection({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
        });
        connection.query("SHOW TABLES", function (error) {
          res(error);
        });
        connection.end();
      }, 500);
    });
  }
  const connection = createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  // Used to store the users
  connection.query(
    "CREATE TABLE IF NOT EXISTS users (id int AUTO_INCREMENT, PRIMARY KEY(`id`), email varchar(255), username varchar(255), password varchar(60))"
  );
  // Used to store the players data
  connection.query(
    "CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool)"
  );
  // Creates a table that contains some key value pairs for data that is needed for some things
  connection.query(
    "CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))"
  );
  // Used to store the leagues settings
  connection.query(
    "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1)"
  );
  // Used to store the leagues users
  connection.query(
    "CREATE TABLE IF NOT EXISTS leagueUsers (leagueID int, user int, points int, money int, formation varchar(255), admin bool DEFAULT 0)"
  );
  // Used to store the Historical Points
  connection.query(
    "CREATE TABLE IF NOT EXISTS points (leagueID int, user int, points int, matchday int)"
  );
  // Used to store transfers
  connection.query(
    "CREATE TABLE IF NOT EXISTS transfers (leagueID int, seller int, buyer int, playeruid varchar(25), value int)"
  );
  // Used to store invite links
  connection.query(
    "CREATE TABLE IF NOT EXISTS invite (inviteID varchar(25) PRIMARY KEY, leagueID int)"
  );
  // Used to store player squads
  connection.query(
    "CREATE TABLE IF NOT EXISTS squad (leagueID int, user int, playeruid varchar(25), position varchar(5))"
  );
  // Checks the version of the database is out of date
  await new Promise((res) => {
    connection.query(
      "SELECT value2 FROM data WHERE value1='version'",
      function (error, result, field) {
        if (result.length > 0) {
          let oldVersion = result[0].value2;
          if (oldVersion == "0.1.1") {
            console.log(
              "This version does not have a supported upgrade path to 1.0.0. Due to only me using this program."
            );
          }
          if (oldVersion == "1.0.0") {
            console.log("Updating database to version 1.0.7");
            // Moves all of the old league data into the new format
            connection.query(
              "SELECT * FROM leagues",
              function (error, result, field) {
                result.forEach((e) => {
                  connection.query(
                    "INSERT IGNORE INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)",
                    [e.leagueName, e.leagueID]
                  );
                  connection.query(
                    "INSERT INTO leagueUsers (leagueID, user, points, money, formation) VALUES (?, ?, ?, ?, ?)",
                    [e.leagueID, e.user, e.points, e.money, e.formation]
                  );
                });
              }
            );
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
            connection.query(
              "ALTER TABLE leagueUsers ADD admin bool DEFAULT 0"
            );
            connection.query("UPDATE leagueUsers SET admin=1");
            oldVersion = "1.1.0";
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
        res();
      }
    );
  });
  connection.end();
  // Makes sure to check if an update is neccessary every 10 seconds
  setInterval(update, 10000);
  updateData();
  // Checks if this is the latest version and if it does adds data
  async function updateInfo() {
    console.log("Checking for updates");
    const releases = await fetch(
      "https://api.github.com/repos/lukasdotcom/Bundesliga/releases"
    ).then((res) => (res.ok ? res.json() : {}));
    if (releases[0] === undefined || releases[0].tag_name === undefined) {
      console.log("Failed to get version data from github api");
      return;
    }
    const connection = createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    if (version.version !== releases[0].tag_name) {
      connection.query(
        "INSERT INTO data (value1, value2) VALUES('updateProgram', ?) ON DUPLICATE KEY UPDATE value2=?",
        [releases[0].html_url, releases[0].html_url]
      );
    } else {
      connection.query("DELETE FROM data WHERE value1='updateProgram'");
    }
    connection.end();
  }
  updateInfo();
  setInterval(updateInfo, 3600000 * 24);
}
startUp();
async function update() {
  const connection = createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  let newDate = new Date();
  // Checks if a new day is happening
  if (day != newDate.getDay()) {
    day = newDate.getDay();
    console.log("Downloading new data for today");
    updateData();
  } else if (
    await new Promise((resolve) => {
      connection.query(
        "SELECT * FROM data WHERE value1='update' and value2='1'",
        function (error, result, field) {
          resolve(result.length > 0);
        }
      );
    })
  ) {
    console.log("Updating data now");
    updateData();
  } else {
    // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
    connection.query(
      "SELECT value2 FROM data WHERE value1='transferOpen'",
      function (error, result, field) {
        if (result.length > 0) {
          const time = result[0].value2;
          if (time > 0) {
            if (time - 10 > 0) {
              const connection2 = createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
              });
              connection2.query(
                "UPDATE data SET value2=? WHERE value1='transferOpen'",
                [time - 10]
              );
              connection2.end();
            } else {
              console.log("Predicted start of matchday");
              updateData();
            }
          }
        }
      }
    );
  }
  connection.query(
    "INSERT INTO data (value1, value2) VALUES('update', '0') ON DUPLICATE KEY UPDATE value2=0"
  );
  connection.end();
}
