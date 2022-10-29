run();
// Used to reset the users and invites for the user test
async function run() {
  const database = require("../../Modules/database");
  const updateData = require("../../scripts/update.js").updateData;
  const connection = await database.default();
  connection.query("DELETE FROM users WHERE username like 'Invite%'");
  connection.query("DELETE FROM invite WHERE inviteID='invite1'");
  connection.query("DELETE FROM data WHERE value1='locked'");
  await updateData("Bundesliga", "../sample/data1.json");
  await connection.end();
}
