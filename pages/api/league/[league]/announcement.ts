import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import connect, { announcements } from "../../../../Modules/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (session) {
    const connection = await connect();
    const league = req.query.league;
    // Variable to check if the league is archived
    const isArchived = connection
      .query("SELECT * FROM leagueSettings WHERE leagueID=? AND archived=0", [
        league,
      ])
      .then((e) => e.length === 0);
    switch (req.method) {
      // Used to add an anouncement
      case "POST":
        // Checks if the user is qualified to do this
        if (
          (
            await connection.query(
              "SELECT * FROM leagueUsers WHERE leagueID=? and user=? AND admin=1",
              [league, session.user.id]
            )
          ).length > 0
        ) {
          // Adds the announcement
          const {
            priority = "info",
            title = "",
            description = "",
          }: announcements = req.body;
          await connection
            .query(
              "INSERT INTO announcements (leagueID, priority, title, description) VALUES (?, ?, ?, ?)",
              [league, priority, title, description]
            )
            .then((e) => res.status(200).end("Added anouncement"))
            .catch((e) => res.status(500).end("Failed to create announcement"));
        } else {
          res.status(401).end("Not admin of this league");
        }
        break;
      case "DELETE": // Used to delete an anouncement
        // Checks if the user is qualified to do this
        if (
          (
            await connection.query(
              "SELECT * FROM leagueUsers WHERE leagueID=? and user=? AND admin=1",
              [league, session.user.id]
            )
          ).length > 0
        ) {
          const { title = "", description = "" }: announcements = req.body;
          await connection.query(
            "DELETE FROM announcements WHERE leagueID=? AND title=? AND description=?",
            [league, title, description]
          );
          res.status(200).end("Deleted announcement");
        } else {
          res.status(401).end("Not admin of this league");
        }
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
