import { NextApiRequest, NextApiResponse } from "next";
import connect from "../../Modules/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    const connection = await connect();
    // Collects all the analytics data
    const day = Math.floor(Date.now() / 1000 / 86400);
    const {
      serverID = "fake",
      version = "0.0.0",
      users = 0,
      activeUsers = 0,
      Bundesliga = 0,
      BundesligaActive = 0,
      EPL = 0,
      EPLActive = 0,
      WorldCup2022 = 0,
      WorldCup2022Active = 0,
    }: {
      serverID: string;
      version: string;
      users: number;
      activeUsers: number;
      Bundesliga: number;
      BundesligaActive: number;
      EPL: number;
      EPLActive: number;
      WorldCup2022: number;
      WorldCup2022Active: number;
    } = req.body;
    // Deletes the analytics data from the user if it already exists
    await connection.query("DELETE FROM analytics WHERE serverID=? AND day=?", [
      serverID,
      day,
    ]);
    // Adds the analytics data
    connection.query(
      "INSERT INTO analytics (serverID, day, version, users, activeUsers, Bundesliga, BundesligaActive, EPL, EPLActive, WorldCup2022, WorldCup2022Active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        serverID,
        day,
        version,
        users,
        activeUsers,
        Bundesliga,
        BundesligaActive,
        EPL,
        EPLActive,
        WorldCup2022,
        WorldCup2022Active,
      ]
    );
    connection.end();
    res.status(200).end();
  } else {
    res.status(400).end("Method does not exist");
  }
}
