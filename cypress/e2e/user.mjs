import connect from "../../Modules/database.mjs";
run();
// Used to reset the users for the user test
async function run() {
  const connection = await connect();
  connection.query(
    "DELETE FROM users WHERE username='Sample User' or username='New Sample Username'"
  );
  await connection.end();
}
