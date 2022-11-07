run();
// Checks if the data after the games have changed gets updated and ends the matchday
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("Bundesliga", "../../sample/data4.json");
  await updateData("Bundesliga", "../../sample/data5.json");
}
