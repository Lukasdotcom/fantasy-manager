import connect from "#database";
import { updateData } from "#scripts/update";

run();

async function run() {
  // Starts the matchday
  await updateData("", "./sample/data2.json");
  const connection = await connect();
  await connection.query("UPDATE clubs SET gameStart=?", [
    Math.floor(Date.now() / 1000 - 200),
  ]);
  connection.end();
  // Simulates all the games
  console.log("PART 2");
  await updateData("", "./sample/data3.json");
}
