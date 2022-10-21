import connect from "../Modules/database";

export async function checkUpdate() {
  const connection = await connect();
  // Checks if matchdays are currently happening and if it is a matchday checks if the update time has passed
  interface dbResult {
    value1: string;
    value2: string;
  }
  // If it is not a matchday it is checked if the update time for that has passed
  const result: dbResult[] = await connection.query(
    "SELECT value2 FROM data WHERE value1='transferOpen' or value1='playerUpdate' ORDER BY value1 DESC"
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
          : String(process.env.MIN_UPDATE_TIME)
      )
  ) {
    connection.query(
      "INSERT INTO data (value1, value2) VALUES('update', '1') ON DUPLICATE KEY UPDATE value2=1"
    );
  }
  connection.end();
}
