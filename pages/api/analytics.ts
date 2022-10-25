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
    const { serverID, version, users, activeUsers } = req.body;
    // Deletes the analytics data from the user if it already exists
    await connection.query("DELETE FROM analytics WHERE serverID=? AND day=?", [
      serverID,
      day,
    ]);
    // Adds the analytics data
    connection.query(
      "INSERT INTO analytics (serverID, day, version, users, activeUsers) VALUES (?, ?, ?, ?, ?)",
      [serverID, day, version, users, activeUsers]
    );
    connection.end();
    res.status(200).end();
  } else {
    res.status(400).end("Method does not exist");
  }
}
