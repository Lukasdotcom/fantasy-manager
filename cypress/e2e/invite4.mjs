import { updateData } from "../../scripts/update.mjs";
run();
// Ends the matchday
async function run() {
  await updateData("../sample/data4.json");
}
