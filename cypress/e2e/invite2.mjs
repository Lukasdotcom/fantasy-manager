import { updateData } from "../../scripts/update.mjs";
run();
// Starts the matchday
async function run() {
  await updateData("../sample/data2.json");
}
