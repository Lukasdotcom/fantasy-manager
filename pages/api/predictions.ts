import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import connect from "#/Modules/database";
import { leagueSettings } from "#/types/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body: {
    home_team: string;
    away_team: string;
    league: number;
    home: number;
    away: number;
  } = req.body;
  if (req.method !== "POST") {
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }
  const user = await getServerSession(req, res, authOptions);
  if (!user) {
    res.status(401).end("Not logged in");
    return;
  }
  const id = user.user.id;
  const connection = await connect();
  if (
    (
      await connection.query(
        "SELECT * FROM leagueUsers WHERE user=? AND leagueID=?",
        [id, body.league],
      )
    ).length === 0
  ) {
    res.status(403).end("You are not in this league");
    return;
  }
  const data: leagueSettings[] = await connection.query(
    "SELECT * FROM leagueSettings WHERE leagueID=? AND predictionsEnabled=1",
    [body.league],
  );
  if (data.length === 0) {
    res.status(403).end("This league does not have predictions enabled. ");
    return;
  }
  const leagueType = data[0].league;
  if (
    await connection
      .query("SELECT * FROM clubs WHERE club=? AND league=? AND opponent=?", [
        body.home_team,
        leagueType,
        body.away_team,
      ])
      .then((res) => res.length === 0)
  ) {
    res.status(400).end("Invalid match");
    return;
  }
  connection
    .query(
      "DELETE FROM predictions WHERE leagueID=? AND user=? AND club=? AND league=?",
      [body.league, id, body.home_team, leagueType],
    )
    .then(() => {
      connection.query(
        "INSERT INTO predictions (leagueID, user, club, league, home, away) VALUES (?, ?, ?, ?, ?, ?)",
        [body.league, id, body.home_team, leagueType, body.home, body.away],
      );
      connection.end();
    });
  res.status(200).end("Saved");
}
