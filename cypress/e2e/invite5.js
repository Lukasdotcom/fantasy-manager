run();
// Simulates a matchday
async function run() {
  const updateData = require("../../scripts/update.js").updateData;
  await updateData("", "../../../sample/data6.json");
  await updateData("", "../../../sample/data5.json");
}
