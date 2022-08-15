import { updateData } from "../../scripts/update.mjs";
run();
// Simulates a matchday
async function run() {
  await updateData("../sample/data6.json");
  await updateData("../sample/data5.json");
}
