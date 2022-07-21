import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";

export default async function handler(req, res) {
  const session = await getSession({ req });
  const connection = await connect();
  if (!session) {
    res.status(401).end("Not logged in");
    return;
  }
  // Is true if the user is in the league
  const inLeague = await connection
    .query("SELECT * FROM leagueUsers WHERE leagueID=? and user=?", [
      req.query.leagueID,
      session.user.id,
    ])
    .then((res) => res.length > 0);
  // Makes sure that user is in the league they claim they are from
  if (!inLeague) {
    res.status(403).end("You are not in this league");
    return;
  }
  switch (req.method) {
    case "POST": // Used to create a new invite link
      await connection.query(
        "INSERT INTO invite (inviteID, leagueID) VALUES(?, ?)",
        [req.body.link, req.body.leagueID]
      );
      console.log(
        `League ${req.body.leagueID} created invite link of ${req.body.link}`
      );
      res.status(200).end("Created Invite Link");
      break;
    case "GET": // Used to get a list of invite links for a league
      const invites = await connection.query(
        "SELECT * FROM invite WHERE leagueID=?",
        [req.query.leagueID]
      );
      res.status(200).json(invites);
      break;
    case "DELETE":
      connection.query("DELETE FROM invite WHERE leagueID=? and inviteID=?", [
        req.body.leagueID,
        req.body.link,
      ]);
      console.log(
        `League ${req.body.leagueID} removed invite link of ${req.body.link}`
      );
      res.status(200).end("Deleted invite link");
      break;
    default:
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
  connection.end();
}
