import { updateData } from "#scripts/update";

run();

async function run() {
  await updateData("", "./sample/data4.json");
  // Ends the matchday for matchday
  await updateData("", "./sample/data5.json");
}
