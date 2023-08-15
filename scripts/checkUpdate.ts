import connect, { data } from "../Modules/database";

export async function checkUpdate(league: string) {
  const connection = await connect();
  // Gets the actual league name
  console.log(league);
  // Checks if matchdays are currently happening and if it is a matchday checks if the update time has passed
  // If it is not a matchday it is checked if the update time for that has passed
  const result: data[] = await connection.query(
    "SELECT value2 FROM data WHERE value1=? or value1=? ORDER BY value1 DESC",
    ["transferOpen" + league, "playerUpdate" + league],
  );
  if (result.length < 2) {
    return;
  }
  if (
    parseInt(result[1].value2) <
    Date.now() / 1000 -
      parseInt(
        result[0].value2 === "true"
          ? String(process.env.MIN_UPDATE_TIME_TRANSFER)
          : String(process.env.MIN_UPDATE_TIME),
      )
  ) {
    await connection.query(
      "INSERT INTO data (value1, value2) VALUES(?, '1') ON DUPLICATE KEY UPDATE value2=1",
      ["update" + league],
    );
  }
  await connection.end();
}
