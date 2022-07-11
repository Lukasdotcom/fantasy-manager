import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (session) {
    const mysql = require("mysql");
    var connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    switch (req.method) {
      // Used to create a new league
      case "POST":
        // Generates an id
        const id = Math.floor(Math.random() * 2000000);
        // Makes sure that the id is not taken
        await new Promise((resolve) => {
          connection.query(
            "SELECT leagueID FROM leagueSettings WHERE leagueID=?",
            [id],
            function (error, results, fields) {
              if (results.length == 0) {
                const startMoney = parseInt(req.body["Starting Money"]);
                if (startMoney > 10000) {
                  connection.query(
                    "INSERT INTO leagueSettings (leagueName, leagueID, startMoney) VALUES (?, ?, ?)",
                    [req.body.name, id, startMoney]
                  );
                } else {
                  connection.query(
                    "INSERT INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)",
                    [req.body.name, id]
                  );
                }
                connection.query(
                  "INSERT INTO leagueUsers (leagueID, user, points, money, formation, admin) VALUES(?, ?, 0, (SELECT startMoney FROM leagueSettings WHERE leagueId=?), '[1, 4, 4, 2]', 1)",
                  [id, session.user.id, id]
                );
                // Checks if the game is in a transfer period and if yes it starts the first matchday automatically
                connection.query(
                  "SELECT value2 FROM data WHERE value1='transferOpen'",
                  function (error, result, field) {
                    if (parseInt(result[0].value2) == 0) {
                      connection.query(
                        "INSERT INTO points (leagueID, user, points, matchday) VALUES(?, ?, 0, 1)",
                        [id, session.user.id]
                      );
                    }
                    res.status(200).end("Created League");
                    console.log(
                      `User ${session.user.id} created league of ${id} with name ${req.body.name}`
                    );
                    resolve();
                  }
                );
              } else {
                throw "Could not create league";
              }
            }
          );
        }).catch(() => {
          console.error("Failure in creating league");
          res.status(500).end("Error Could not create league");
        });
        break;
      case "GET": // Returns all leagues the user is in
        res.status(200).json(await leagueList(session.user.id));
        break;
      default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
        break;
    }
    connection.end();
  } else {
    res.status(401).end("Not logged in");
  }
}
// A Promise that gets all of the leagues a user is in
export async function leagueList(user) {
  var mysql = require("mysql");
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  return new Promise((resolve) => {
    connection.query(
      "SELECT leagueName, leagueID FROM leagueSettings WHERE EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
      [user],
      function (error, results, fields) {
        connection.end();
        resolve(results);
      }
    );
  });
}
