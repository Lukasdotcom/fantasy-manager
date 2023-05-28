import { updateData } from "#/scripts/update";
import connect from "#database";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    case "POST":
      // Used to edit or create a plugin
      const {
        body: { url = "", enabled = false, settings = "{}" },
      } = req;
      const connection = await connect();
      // Check if the plugin existss
      const plugin = await connection.query(
        "SELECT * FROM plugins WHERE url=?",
        [url]
      );
      if (plugin.length === 0) {
        // Creates the plugin
        await connection.query(
          "INSERT INTO plugins (settings, enabled, url) VALUES (?, ?, ?)",
          [settings, enabled, url]
        );
        res.status(200).end("Created Plugin");
      } else {
        // Update the plugin
        // Checks if the plugin should be enabled and if it is it checks that there is no other plugin with the same name enabled
        if (
          enabled &&
          (
            await connection.query(
              "SELECT * FROM plugins WHERE enabled=? AND url!=? AND name=?",
              [
                true,
                url,
                await connection
                  .query("SELECT name FROM plugins WHERE url=?", [url])
                  .then((res) => (res.length > 0 ? res[0].name : "")),
              ]
            )
          ).length > 0
        ) {
          res.status(400).end("A plugin with the same name is already enabled");
          return;
        } else {
          await connection.query(
            "UPDATE plugins SET enabled=?, settings=? WHERE url=?",
            [enabled, settings, url]
          );
          res.status(200).end("Plugin updated");
          // Runs the plugin once
          if (enabled) {
            updateData(url);
          }
        }
      }
      connection.end();
      break;
    case "DELETE":
      // Deletes the plugin
      const connection2 = await connect();
      await connection2.query("DELETE FROM plugins WHERE url=?", [
        req.query.url,
      ]);
      res.status(200).end("Plugin deleted");
      break;
    default:
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
