import connect from "../../../Modules/database.mjs";

// Used to return the username of a selected user
export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      const connection = await connect();
      // Gets the id
      const id = req.query.id;
      await new Promise(async (resolve) => {
        // Checks if the user exists
        const users = await connection.query(
          "SELECT username FROM users WHERE id=?",
          [id]
        );
        if (users.length > 0) {
          // Adds a 30 second cache if not development
          if (
            process.env.APP_ENV !== "development" &&
            process.env.APP_ENV !== "test"
          ) {
            res.setHeader("Cache-Control", "public, max-age=30");
          }
          res.status(200).json(users[0].username);
          resolve();
        } else {
          res.status(404).end("Player not found");
          resolve();
        }
      });
      connection.end();
      break;
    default:
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
