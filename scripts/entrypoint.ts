import connect, { data, validLeagueUrls } from "../Modules/database";
import { updateData } from "./update";
import version from "./../package.json";
import dotenv from "dotenv";
import compileAnalytics from "./compileAnalytics";
const analyticsDomain = "https://fantasy.lschaefer.xyz";
const date = new Date();
let day = date.getDay();
if (process.env.APP_ENV !== "test") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config({ path: ".env.test.local" });
}
// Makes sure to check if an action is neccessary every 10 seconds
setInterval(update, 10000);
async function updateAllLeagues() {
  const leagues = await validLeagueUrls();
  leagues.forEach((e) => {
    updateData(e);
  });
}
updateAllLeagues();
async function update() {
  const leagues = await validLeagueUrls();
  const connection3 = await connect();
  // Increases the throttle attempts left by 1
  connection3.query("UPDATE users SET throttle=throttle+1 WHERE throttle<30");
  const newDate = new Date();
  // Checks if a new day is happening
  if (day != newDate.getDay()) {
    day = newDate.getDay();
    // Gathers the analytics data
    const users = await connection3.query("SELECT * FROM users");
    const localeActive: { [Key: string]: number } = {};
    const localeTotal: { [Key: string]: number } = {};
    const themeActive: { [Key: string]: number } = {};
    const themeTotal: { [Key: string]: number } = {};
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
    const leagueActive: { [Key: string]: number } = {};
    const leagueTotal: { [Key: string]: number } = {};
    for (const league of leagues) {
      // Calculates all the leagues for the users
      leagueActive[league] = (
        await connection3.query(
          "SELECT * FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND leagueSettings.archived=0) AND EXISTS (SELECT * FROM users WHERE users.id=leagueUsers.user AND active='1')",
          [league],
        )
      ).length;
      leagueTotal[league] = (
        await connection3.query(
          "SELECT * FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=? AND leagueSettings.archived=0)",
          [league],
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
      await fetch(`${analyticsDomain}/api/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONbody,
      }).catch((e) => {
        console.error("Failed to send analytics data with error: ", e);
      });
    }
    // Sends the analytics data to the server
    await fetch(`http://localhost:3000/api/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONbody,
    });
    connection3.query("UPDATE users SET active=0");
    // Has the analytics get compiled for all days that have happened since this day
    setTimeout(async () => {
      const connection3 = await connect();
      const lastDay = await connection3.query(
        "SELECT max(day) AS max FROM analytics",
      );
      const today = Math.floor(Date.now() / 1000 / 86400);
      if (lastDay.length > 0) {
        let max = lastDay[0].max;
        while (max < today) {
          await compileAnalytics(max);
          max++;
        }
      }
      await compileAnalytics(today);
      console.log("Compiled server analytics");
      connection3.end();
    }, 10000);
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
            ["update" + e],
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
          ["update" + e],
        );
        // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
        const countdown = await connection3.query(
          "SELECT value2 FROM data WHERE value1=?",
          ["countdown" + e],
        );
        const transferOpen = await connection3
          .query("SELECT value2 FROM data WHERE value1=?", ["transferOpen" + e])
          .then((res: data[]) =>
            res.length > 0 ? res[0].value2 === "true" : false,
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
                  `Predicting start of matchday in ${time} seconds for ${e}`,
                );
                // Makes sure to wait until the time is done
                setTimeout(
                  () => {
                    updateData(e);
                  },
                  time * 1000 + 1,
                );
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
                  `Predicting end of matchday in ${time} seconds for ${e}`,
                );
                setTimeout(
                  () => {
                    updateData(e);
                  },
                  time * 1000 + 1,
                );
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
    }),
  );
  // Updates the latest update check value
  connection3.query(
    "INSERT INTO data (value1, value2) VALUES('lastUpdateCheck', ?) ON DUPLICATE KEY UPDATE value2=?",
    [
      String(Math.floor(Date.now() / 1000)),
      String(Math.floor(Date.now() / 1000)),
    ],
  );
  connection3.end();
}
