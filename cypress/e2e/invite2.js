run();
// Starts the matchday
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("Bundesliga", "../../sample/data2.json");
}
