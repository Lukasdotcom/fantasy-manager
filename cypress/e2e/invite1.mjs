import connect from "../../Modules/database.mjs";
import { updateData } from "../../scripts/update.mjs";
run();
// Used to reset the users and invites for the user test
async function run() {
  const connection = await connect();
  connection.query("DELETE FROM users WHERE username like 'Invite%'");
  connection.query("DELETE FROM invite WHERE inviteID='invite1'");
  connection.query("DELETE FROM data WHERE value1='locked'");
  await updateData("../sample/data1.json");
  await connection.end();
}
