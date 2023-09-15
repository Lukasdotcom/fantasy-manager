import { updateData } from "#scripts/update";

run();
// Simulates all the games
async function run() {
  await updateData("", "./sample/data3.json");
}
