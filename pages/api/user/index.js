import connect from "../../../Modules/database";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";

// Used to change a users username
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const id = session.user.id;
  switch (req.method) {
    case "POST":
      if (!session) {
        res.status(401).end("Not logged in");
      } else if (req.body.password !== undefined) {
        // Updates the password if one is given.
        const password = req.body.password;
        const connection = await connect();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const bcrypt = require("bcryptjs");
        connection.query("UPDATE users SET password=? WHERE id=?", [
          password === ""
            ? ""
            : bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS)),
          id,
        ]);
        res
          .status(200)
          .end(password === "" ? "Disabled password auth" : "Changed password");
        console.log(
          `User ${id} ${password === "" ? "disabled" : "changed"} password`
        );
        connection.end();
      } else if (
        req.body.provider === "google" ||
        req.body.provider === "github"
      ) {
        // Used to update the username
        const email = String(req.body.email);
        const connection = await connect();
        // Disconnects the email
        if (email == "") {
          connection.query(
            `UPDATE users SET ${req.body.provider}='' WHERE id=?`,
            [id]
          );
          console.log(`User ${id} disconnected from ${req.body.provider}`);
          res.status(200).end(`Disconnected from {provider}`);
        } else {
          connection.query(
            `UPDATE users SET ${req.body.provider}=? WHERE id=?`,
            [email, id]
          );
          console.log(`User ${id} connected to ${req.body.provider}`);
          res.status(200).end(`Connected to {provider}`);
        }
        connection.end();
        // Used to update the league favorite
      } else if (req.body.favorite) {
        const connection = await connect();
        // Checks if a possible favorite is given otherwise favorites are cleared
        if (parseInt(req.body.favorite) > 0) {
          connection.query("UPDATE users SET favoriteLeague=? WHERE id=?", [
            parseInt(req.body.favorite),
            id,
          ]);
        } else {
          connection.query("UPDATE users SET favoriteLeague=null WHERE id=?", [
            id,
          ]);
        }
        connection.end();
        res.status(200).end("Updated favorite");
      } else if (req.body.theme) {
        const connection = await connect();
        connection.query("UPDATE users SET theme=? WHERE id=?", [
          req.body.theme,
          id,
        ]);
        connection.end();
        res.status(200).end("Updated theme");
      } else if (req.body.locale) {
        const connection = await connect();
        connection.query("UPDATE users SET locale=? WHERE id=?", [
          req.body.locale,
          id,
        ]);
        connection.end();
        res.status(200).end("Updated locale");
      } else if (
        req.body.username === undefined ||
        String(req.body.username) === ""
      ) {
        // Checks if a username was given for this change
        res.status(500).end("No username given");
      } else {
        const connection = await connect();
        connection.query("UPDATE users SET username=? WHERE id=?", [
          req.body.username,
          id,
        ]);
        res.status(200).end("Changed username");
        console.log(`User ${id} changed username to ${req.body.username}`);
        connection.end();
      }
      break;
    // Used to delete the user
    case "DELETE":
      if (!session) {
        res.status(401).end("Not logged in");
        // Makes sure the user passed the correct id
      } else if (req.body.user === id) {
        const connection = await connect();
        // Checks if the user is in any leagues
        const anyLeagues = await connection
          .query("SELECT * FROM leagueUsers WHERE user=? LIMIT 1", [id])
          .then((e) => e.length > 0);
        if (anyLeagues) {
          res.status(401).end("You can not be in any leagues");
        } else {
          console.log(`User ${id} was deleted`);
          await connection.query("DELETE FROM users WHERE id=?", [id]);
          res.status(200).end("Deleted user successfully");
        }
        connection.end();
      } else {
        res.status(400).end("Please pass the user id under user.");
      }
      break;
    default:
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
