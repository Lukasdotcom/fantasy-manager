import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (session) {
    const connection = await connect();
    switch (req.method) {
      // Used to create a new league
      case "POST":
        // Generates an id between 0 and 2 billion
        const id = Math.floor(Math.random() * 2000000);
        // Makes sure that the id is not taken
        const idUsed = await connection
          .query("SELECT leagueID FROM leagueSettings WHERE leagueID=?", [id])
          .then((res) => res.length > 0);
        if (idUsed) {
          res.status(500).end("Failed to create league");
          break;
        }
        const startMoney = parseInt(req.body["Starting Money"]);
        if (startMoney > 10000) {
          await connection.query(
            "INSERT INTO leagueSettings (leagueName, leagueID, startMoney) VALUES (?, ?, ?)",
            [req.body.name, id, startMoney]
          );
        } else {
          await connection.query(
            "INSERT INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)",
            [req.body.name, id]
          );
        }
        connection.query(
          "INSERT INTO leagueUsers (leagueID, user, points, money, formation, admin) VALUES(?, ?, 0, (SELECT startMoney FROM leagueSettings WHERE leagueId=?), '[1, 4, 4, 2]', 1)",
          [id, session.user.id, id]
        );
        // Checks if the game is in a transfer period and if yes it starts the first matchday automatically
        const transferClosed = await connection
          .query("SELECT value2 FROM data WHERE value1='transferOpen'")
          .then((res) => parseInt(res[0].value2) == 0);
        if (transferClosed) {
          connection.query(
            "INSERT INTO points (leagueID, user, points, matchday) VALUES(?, ?, 0, 1)",
            [id, session.user.id]
          );
        }
        res.status(200).end("Created League");
        console.log(
          `User ${session.user.id} created league of ${id} with name ${req.body.name}`
        );
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
  const connection = await connect();
  const leagues = await connection.query(
    "SELECT leagueName, leagueID FROM leagueSettings WHERE EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
    [user]
  );
  connection.end();
  return leagues;
}
