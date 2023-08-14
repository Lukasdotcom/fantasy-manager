import { NextApiRequest, NextApiResponse } from "next";
import connect, { detailedAnalytics } from "../../Modules/database";
import { compareSemanticVersions } from "../../Modules/semantic";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method == "POST") {
    // Collects the data from the request
    let {
      active = 0,
      total = 0,
      leagueActive = "{}",
      leagueTotal = "{}",
    }: detailedAnalytics = req.body;
    const {
      serverID = "fake",
      version = "0.0.0",
      themeActive = "{}",
      themeTotal = "{}",
      localeActive = "{}",
      localeTotal = "{}",
    }: detailedAnalytics = req.body;
    // Makes sure that the JSON is valid
    try {
      JSON.parse(leagueActive);
      JSON.parse(leagueTotal);
      JSON.parse(themeActive);
      JSON.parse(themeTotal);
      JSON.parse(localeActive);
      JSON.parse(localeTotal);
    } catch (_) {
      res.status(400).send("Invalid JSON");
      return;
    }
    const connection = await connect();
    const day = Math.floor(Date.now() / 1000 / 86400);
    // Checks if the analytics have to be translated from the old version used before 1.11 to the new version.
    if (compareSemanticVersions("1.11.0", version) === 1) {
      if (req.body?.users) {
        total = req.body.users;
      }
      if (req.body?.activeUsers) {
        active = req.body.activeUsers;
      }
      const tempLeagueActive: { [Key: string]: number } = {};
      if (req.body?.BundesligaActive) {
        tempLeagueActive.Bundesliga = req.body.BundesligaActive;
      }
      if (req.body?.EPLActive) {
        tempLeagueActive.EPL = req.body.EPLActive;
      }
      if (req.body?.WorldCup2022Active) {
        tempLeagueActive.WorldCup2022 = req.body.WorldCup2022Active;
      }
      leagueActive = JSON.stringify(tempLeagueActive);
      const tempLeagueTotal: { [Key: string]: number } = {};
      if (req.body?.Bundesliga) {
        tempLeagueTotal.Bundesliga = req.body.Bundesliga;
      }
      if (req.body?.EPL) {
        tempLeagueTotal.EPL = req.body.EPL;
      }
      if (req.body?.WorldCup2022) {
        tempLeagueTotal.WorldCup2022 = req.body.WorldCup2022;
      }
      leagueTotal = JSON.stringify(tempLeagueTotal);
    }
    // Deletes the analytics data from the user if it already exists
    await connection.query(
      "DELETE FROM detailedAnalytics WHERE serverID=? AND day=?",
      [serverID, day],
    );
    // Adds the analytics data
    await connection.query(
      "INSERT INTO detailedAnalytics (serverID, day, version, active, total, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        serverID,
        day,
        version,
        active,
        total,
        leagueActive,
        leagueTotal,
        themeActive,
        themeTotal,
        localeActive,
        localeTotal,
      ],
    );
    await connection.end();
    res.status(200).end();
  } else {
    res.status(400).end("Method does not exist");
  }
}
