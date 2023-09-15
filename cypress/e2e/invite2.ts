import { updateData } from "#scripts/update";

run();
// Starts the matchday
async function run() {
  await updateData("", "./sample/data2.json");
}
