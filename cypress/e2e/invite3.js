run();
// Simulates all the games
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("Bundesliga", "../../sample/data3.json");
}
