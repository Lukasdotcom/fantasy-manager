import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import connect, { leagues } from "../../../Modules/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (session) {
    const connection = await connect();
    switch (req.method) {
      // Used to create a new league
      case "POST":
        // Generates the next id
        const id = await connection
          .query("SELECT max(leagueID) FROM leagueSettings")
          .then((e) => (e.length > 0 ? e[0]["max(leagueID)"] + 1 : 1));
        // Makes sure that the id is not taken
        const idUsed = await connection
          .query("SELECT leagueID FROM leagueSettings WHERE leagueID=?", [id])
          .then((res) => res.length > 0);
        if (idUsed) {
          res.status(500).end("Failed to create league");
          break;
        }
        const leagueType = req.body.leagueType;
        if (!leagues.includes(leagueType)) {
          res.status(404).end("Invalud league type given");
          break;
        }
        if (req.body.name == "") {
          res.status(500).end("Invalid league name given");
          break;
        }
        const startMoney = parseInt(req.body["Starting Money"]);
        if (startMoney > 100000) {
          await connection.query(
            "INSERT INTO leagueSettings (leagueName, leagueID, startMoney, league) VALUES (?, ?, ?, ?)",
            [req.body.name, id, startMoney, leagueType]
          );
        } else {
          await connection.query(
            "INSERT INTO leagueSettings (leagueName, leagueID, league) VALUES (?, ?, ?)",
            [req.body.name, id, leagueType]
          );
        }
        // Makes sure that the id was created
        const idCreated = await connection
          .query("SELECT leagueID FROM leagueSettings WHERE leagueID=?", [id])
          .then((res) => res.length > 0);
        if (!idCreated) {
          res.status(500).end("Failed to create league");
          break;
        }
        connection.query(
          "INSERT INTO leagueUsers (leagueID, user, points, money, formation, admin) VALUES(?, ?, 0, (SELECT startMoney FROM leagueSettings WHERE leagueId=?), '[1, 4, 4, 2]', 1)",
          [id, session.user.id, id]
        );
        // Checks if the game is in a transfer period and if yes it starts the first matchday automatically
        const transferClosed = await connection
          .query("SELECT value2 FROM data WHERE value1=?", [
            "transferOpen" + leagueType,
          ])
          .then((res) => res[0].value2 !== "true");
        if (transferClosed) {
          connection.query(
            "INSERT INTO points (leagueID, user, points, matchday, time, money) VALUES(?, ?, 0, 1, 0, 0)",
            [id, session.user.id]
          );
        }
        res.status(200).end("Created League");
        console.log(
          `User ${session.user.id} created league of ${id} with name ${req.body.name}`
        );
        break;
      case "GET": // Returns all leagues and archived leagues the user is in
        res.status(200).json({
          leagues: await connection.query(
            "SELECT leagueName, leagueID FROM leagueSettings WHERE archived=0 AND EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
            [session.user.id]
          ),
          archived: await connection.query(
            "SELECT leagueName, leagueID FROM leagueSettings WHERE archived!=0 AND EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID) ORDER BY archived DESC",
            [session.user.id]
          ),
        });
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
export interface LeagueListResult {
  leagues: LeagueListPart[];
  archived: LeagueListPart[];
}
export interface LeagueListPart {
  leagueName: string;
  leagueID: number;
}
