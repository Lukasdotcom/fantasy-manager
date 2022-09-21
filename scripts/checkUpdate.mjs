import connect from "../Modules/database.mjs";

export async function checkUpdate() {
  const connection = await connect();
  // Checks if matchdays are currently happening and if it is a matchday checks if the update time has passed
  // If it is not a matchday it is checked if the update time for that has passed
  const result = await connection.query(
    "SELECT value2 FROM data WHERE value1='transferOpen' or value1='playerUpdate' ORDER BY value1 DESC"
  );
  if (
    parseInt(result[1].value2) <
    parseInt(Date.now() / 1000) -
      parseInt(
        result[0].value2 === "true"
          ? process.env.MIN_UPDATE_TIME_TRANSFER
          : process.env.MIN_UPDATE_TIME
      )
  ) {
    connection.query(
      "INSERT INTO data (value1, value2) VALUES('update', '1') ON DUPLICATE KEY UPDATE value2=1"
    );
  }
  connection.end();
}
