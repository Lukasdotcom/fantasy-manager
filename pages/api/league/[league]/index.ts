import connect from "../../../../Modules/database";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { leaveLeague } from "#/Modules/delete";
import { archive_league } from "#/Modules/league";

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
        if (
          (
            await connection.query(
              "SELECT * FROM leagueUsers WHERE leagueID=? AND user=? AND admin=1",
              [league, session.user.id],
            )
          ).length > 0
        ) {
          if (Array.isArray(req.body.users)) {
            // Updates all the users from admin to not admin
            req.body.users.forEach((e: { user: number; admin: boolean }) => {
              connection.query(
                "UPDATE leagueUsers SET admin=? WHERE leagueID=? and user=?",
                [e.admin, league, e.user],
              );
            });
          }
          if (req.body.settings !== undefined) {
            const settings = req.body.settings;
            if (parseInt(settings.startingMoney) < 10000) {
              res.status(400).end("Starting money too low");
            } else if (parseInt(settings.transfers) <= 0) {
              res.status(400).end("At least one transfer must be allowed");
            } else if (parseInt(settings.duplicatePlayers) <= 0) {
              res.status(400).end("Duplicate Players must be greater than 0");
            } else if (parseInt(settings.starredPercentage) < 100) {
              res.status(400).end("Star bonus can not be less than 100%");
            } else if (isNaN(parseInt(settings.predictWinner))) {
              res.status(400).end("Predict winner must be a number");
            } else if (isNaN(parseInt(settings.predictDifference))) {
              res.status(400).end("Predict difference must be a number");
            } else if (isNaN(parseInt(settings.predictExact))) {
              res.status(400).end("Predict exact must be a number");
            } else {
              connection.query(
                "UPDATE leagueSettings SET leagueName=?, startMoney=?, transfers=?, duplicatePlayers=?, starredPercentage=?, matchdayTransfers=?, fantasyEnabled=?, predictionsEnabled=?, predictWinner=?, predictDifference=?, predictExact=?, top11=? WHERE leagueID=?",
                [
                  String(settings.leagueName),
                  parseInt(settings.startingMoney),
                  parseInt(settings.transfers),
                  parseInt(settings.duplicatePlayers),
                  parseInt(settings.starredPercentage),
                  Boolean(settings.matchdayTransfers),
                  Boolean(settings.fantasyEnabled),
                  Boolean(settings.predictionsEnabled),
                  parseInt(settings.predictWinner),
                  parseInt(settings.predictDifference),
                  parseInt(settings.predictExact),
                  Boolean(settings.top11),
                  league,
                ],
              );
              // Archives the league when told to do so
              if (settings.archive === true) {
                console.log(`League ${league} was archived`);
                archive_league(league);
              }
              res.status(200).end("Saved settings");
            }
          }
        } else {
          res.status(401).end("You are not admin of this league");
        }
        break;
      case "DELETE":
        // Used to leave a league
        await leaveLeague(parseInt(String(league)), session.user.id);
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
