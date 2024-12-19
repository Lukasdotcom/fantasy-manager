import connect from "../../../../Modules/database";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { leagueUsers, points } from "#type/database";
import { calcHistoricalPredictionPoints } from "#scripts/calcPoints";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const connection = await connect();
    const league = parseInt(req.query.league as string);
    // Variable to check if the league is archived
    const isArchived = connection
      .query("SELECT * FROM leagueSettings WHERE leagueID=? AND archived=0", [
        league,
      ])
      .then((e) => e.length === 0);
    switch (req.method) {
      // Used to edit a league
      case "POST":
        if (await isArchived) {
          res.status(400).end("This league is archived");
          break;
        }
        // Checks if the user is qualified to do this
        const user: leagueUsers[] = await connection.query(
          "SELECT * FROM leagueUsers WHERE leagueID=? AND user=? AND admin=1",
          [league, session.user.id],
        );
        if (user.length === 0) {
          res.status(403).end("You are not admin of this league");
          break;
        }
        const matchdays: points[] = await connection.query(
          "SELECT * FROM points WHERE leagueID=? ORDER BY user ASC",
          [league],
        );
        let curr_user = -1;
        let curr_leagueID = -1;
        let change_in_points = 0;
        for (const matchday of matchdays) {
          if (curr_user !== matchday.user) {
            if (curr_user !== -1) {
              await connection.query(
                "UPDATE main.leagueUsers SET points=points+?, predictionPoints=predictionPoints+? WHERE leagueID=? AND user=?",
                [change_in_points, change_in_points, curr_leagueID, curr_user],
              );
            }
            curr_user = matchday.user;
            curr_leagueID = matchday.leagueID;
            change_in_points = 0;
          }
          const points = await calcHistoricalPredictionPoints(matchday);
          change_in_points += points - matchday.predictionPoints;
          await connection.query(
            "UPDATE points SET predictionPoints=?, points=points+? WHERE matchday=? AND leagueID=? AND user=?",
            [
              points,
              points - matchday.predictionPoints,
              matchday.matchday,
              matchday.leagueID,
              matchday.user,
            ],
          );
        }
        res.status(200).end("Updated prediction points");
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
