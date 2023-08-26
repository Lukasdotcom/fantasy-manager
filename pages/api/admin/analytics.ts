import connect from "#database";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Check if the user is logged in and an admin
  const user = await getServerSession(req, res, authOptions);
  if (!user) {
    res.status(401).end("Not logged in");
    return;
  }
  if (!user.user.admin) {
    res.status(403).end("Not an admin");
    return;
  }
  switch (req.method) {
    case "GET":
      // Gets analytics data
      const connection = await connect();
      const result = await connection.query(
        "SELECT * FROM analytics WHERE day>=? AND day<?+50",
        [req.query.day, req.query.day],
      );
      if (
        process.env.APP_ENV !== "development" &&
        process.env.APP_ENV !== "test"
      ) {
        res.setHeader("Cache-Control", `private, max-age=108000`);
      }
      res.status(200).json(result);
      break;
    default:
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
