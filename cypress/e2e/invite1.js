run();
// Used to reset the users and invites for the user test
async function run() {
  const database = require("../../Modules/database");
  const updateData = require("../../scripts/update.js").updateData;
  const connection = await database.default();
  await connection.query("DELETE FROM users WHERE username like 'Invite%'");
  await connection.query("DELETE FROM invite WHERE inviteID='invite1'");
  await connection.query("DELETE FROM data WHERE value1='locked'");
  await updateData("", "./sample/data1.json");
  await connection.end();
}
