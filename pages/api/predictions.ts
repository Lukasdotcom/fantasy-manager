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
    gameStart: number;
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
    connection.end();
    res.status(403).end("You are not in this league. ");
    return;
  }
  const data: leagueSettings[] = await connection.query(
    "SELECT * FROM leagueSettings WHERE leagueID=? AND predictionsEnabled=1",
    [body.league],
  );
  if (data.length === 0) {
    connection.end();
    res.status(403).end("This league does not have predictions enabled. ");
    return;
  }
  const leagueType = data[0].league;
  if (
    await connection
      .query(
        "SELECT * FROM clubs WHERE club=? AND league=? AND gameStart>? AND opponent=?",
        [body.home_team, leagueType, Date.now() / 1000, body.away_team],
      )
      .then((res) => res.length === 0)
  ) {
    // Check if this is a future game
    if (
      await connection
        .query(
          "SELECT * FROM futureClubs WHERE club=? AND league=? AND gameStart=? AND opponent=?",
          [body.home_team, leagueType, body.gameStart, body.away_team],
        )
        .then((res) => res.length === 0)
    ) {
      connection.end();
      res.status(400).end("Invalid match");
      return;
    }
    await connection.query(
      "INSERT INTO futurePredictions (leagueID, user, club, league, gameStart, home, away) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE home=?, away=?",
      [
        body.league,
        id,
        body.home_team,
        leagueType,
        body.gameStart,
        body.home,
        body.away,
        body.home,
        body.away,
      ],
    );
    console.log(
      `User ${id} predicted for match ${body.home_team}-${body.away_team} in future time ${body.gameStart} the score of ${body.home}-${body.away} in league ${body.league}`,
    );
    connection.end();
    res.status(200).end("Saved");
    return;
  }
  await connection.query(
    "INSERT INTO predictions (leagueID, user, club, league, home, away) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE home=?, away=?",
    [
      body.league,
      id,
      body.home_team,
      leagueType,
      body.home,
      body.away,
      body.home,
      body.away,
    ],
  );
  connection.end();
  console.log(
    `User ${id} predicted for match ${body.home_team}-${body.away_team} the score of ${body.home}-${body.away} in league ${body.league}`,
  );
  res.status(200).end("Saved");
}
