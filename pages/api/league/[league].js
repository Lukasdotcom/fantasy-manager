import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (session) {
    const mysql = require("mysql");
    const connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    const league = req.query.league;
    switch (req.method) {
      // Used to edit a league
      case "POST":
        // Checks if the user is qualified to do this
        if (
          await new Promise((res) => {
            connection.query(
              "SELECT * FROM leagueUsers WHERE leagueID=? and user=?",
              [league, session.user.id],
              function (error, result, field) {
                res(result.length > 0);
              }
            );
          })
        ) {
          if (req.body.users !== undefined) {
            if (req.body.users.forEach !== undefined) {
              // Updates all the users from admin to not admin
              req.body.users.forEach((e) => {
                connection.query(
                  "UPDATE leagueUsers SET admin=? WHERE leagueID=? and user=?",
                  [e.admin, league, e.user]
                );
              });
            }
          }
          if (req.body.settings !== undefined) {
            const settings = req.body.settings;
            if (parseInt(settings.startingMoney) > 10000)
              connection.query(
                "UPDATE leagueSettings SET startMoney=? WHERE leagueID=?",
                [parseInt(settings.startingMoney), league]
              );
            if (parseInt(settings.transfers) > 0)
              connection.query(
                "UPDATE leagueSettings SET transfers=? WHERE leagueID=?",
                [parseInt(settings.transfers), league]
              );
            if (parseInt(settings.duplicatePlayers) > 0)
              connection.query(
                "UPDATE leagueSettings SET duplicatePlayers=? WHERE leagueID=?",
                [parseInt(settings.duplicatePlayers), league]
              );
          }
          res.status(200).end("Saved Settings");
        } else {
          res.status(401).end("Not admin of this league");
        }
        break;
      case "GET": // Returns the league Settings and which users are admins
        // Checks if the user is qualified to do this
        if (
          await new Promise((res) => {
            connection.query(
              "SELECT * FROM leagueUsers WHERE leagueID=? and user=?",
              [league, session.user.id],
              function (error, result, field) {
                res(result.length > 0);
              }
            );
          })
        ) {
          res.status(200).json(
            await new Promise((res) => {
              // Gets the settings for the league
              connection.query(
                "SELECT * FROM leagueSettings WHERE leagueID=?",
                [league],
                function (error, settings, field) {
                  if (settings.length == 0)
                    throw `Could not find league settings for league ${leagueID}`;
                  settings = settings[0];
                  // Gets a list of users and says which ones are admins
                  connection.query(
                    "SELECT user, admin FROM leagueUsers WHERE leagueID=?",
                    [league],
                    function (error, users, field) {
                      res({
                        users,
                        settings,
                      });
                    }
                  );
                }
              );
            })
          );
        } else {
          res.status(401).end("Not admin of this league");
        }
        break;
      case "DELETE":
        // Used to leave a league
        connection.query(
          "DELETE FROM leagueUsers WHERE leagueID=? and user=?",
          [league, session.user.id]
        );
        connection.query("DELETE FROM points WHERE leagueID=? and user=?", [
          league,
          session.user.id,
        ]);
        connection.query("DELETE FROM squad WHERE leagueID=? and user=?", [
          league,
          session.user.id,
        ]);
        connection.query(
          "UPDATE transfers SET seller='' WHERE leagueID=? and seller=?",
          [league, session.user.id]
        );
        connection.query(
          "UPDATE transfers SET buyer='' WHERE leagueID=? and buyer=?",
          [league, session.user.id]
        );
        console.log(`User ${session.user.id} left league ${league}`);
        // Checks if the league still has users
        connection.query(
          "SELECT * FROM leagueUsers WHERE leagueID=?",
          [league],
          function (error, result, field) {
            const connection2 = mysql.createConnection({
              host: process.env.MYSQL_HOST,
              user: process.env.MYSQL_USER,
              password: process.env.MYSQL_PASSWORD,
              database: process.env.MYSQL_DATABASE,
            });
            if (result.length == 0) {
              connection2.query("DELETE FROM invite WHERE leagueID=?", [
                league,
              ]);
              connection2.query("DELETE FROM transfers WHERE leagueID=?", [
                league,
              ]);
              connection2.query("DELETE FROM leagueSettings WHERE leagueId=?", [
                league,
              ]);
              connection2.end();
              console.log(`League ${league} is now empty and is being deleted`);
            }
          }
        );
        res.status(200).end("Left league");
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
