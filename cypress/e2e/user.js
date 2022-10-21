run();
// Used to reset the users for the user test
async function run() {
  const database = require("../../Modules/database");
  const connection = await database.default();
  connection.query(
    "DELETE FROM users WHERE username='Sample User' or username='New Sample Username'"
  );
  await connection.end();
}
