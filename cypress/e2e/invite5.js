run();
// Simulates a matchday
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("Bundesliga", "../../sample/data6.json");
  await updateData("Bundesliga", "../../sample/data5.json");
}
