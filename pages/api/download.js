import connect from "../../Modules/database.mjs";
import { stringify } from "csv-stringify/sync";

export default async function handler(req, res) {
  const connection = await connect();
  let extraText = "";
  // Checks if the player wants to show all the hidden ones
  if (req.query.showHidden !== "true") {
    extraText += " WHERE `exists`=1";
  }
  const data =
    parseInt(req.query.time) > 0
      ? (
          await connection.query(`SELECT * FROM historicalPlayers${extraText}`)
        ).map((e) => {
          e.value = e.value / 1000000;
          return e;
        })
      : (await connection.query(`SELECT * FROM players${extraText}`)).map(
          (e) => {
            e.value = e.value / 1000000;
            return e;
          }
        );
  // Checks if this is a download by csv or json
  if (req.query.type === "csv") {
    res.setHeader("Content-Type", "application/csv");
    res.setHeader("Content-Disposition", "attachment; filename=players.csv");
    res.status(200).end(
      stringify([
        {
          uid: "Uid",
          name: "Name",
          club: "Club",
          pictureUrl: "Picture Url",
          value: "Value",
          position: "Position",
          forecast: "Forecast",
          total_points: "Total Points",
          average_points: "Average Points",
          last_match: "Last Match Points",
          exists: "Exists",
        },
        ...data,
      ])
    );
  } else {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=players.json");
    res.status(200).end(JSON.stringify(data));
  }
  console.log(
    `A ${
      req.query.type === "csv" ? "csv" : "json"
    } download was requested for ${
      parseInt(req.query.time) > 0 ? parseInt(req.query.time) : "latest"
    } time`
  );
  connection.end();
}
