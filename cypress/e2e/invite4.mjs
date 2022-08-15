import { updateData } from "../../scripts/update.mjs";
run();
// Checks if the data after the games have changed gets updated and ends the matchday
async function run() {
  await updateData("../sample/data4.json");
  await updateData("../sample/data5.json");
}
