import connect from "#database";
import { updateData } from "#scripts/update";

run();
// Used to reset the users and invites for the user test
async function run() {
  const connection = await connect();
  await connection.query(
    "DELETE FROM users WHERE username like 'Predictions%'",
  );
  await connection.query("DELETE FROM clubs");
  await connection.query("DELETE FROM historicalClubs");
  await connection.query("DELETE FROM data WHERE value1 like 'locked%'");
  await updateData("", "./sample/data1.json");
  await connection.end();
}
