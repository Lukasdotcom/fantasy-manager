run();
// Starts the matchday
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("../sample/data2.json");
}
