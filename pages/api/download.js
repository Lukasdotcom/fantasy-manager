import connect from "../../Modules/database.mjs";
import { stringify } from "csv-stringify/sync";

export default async function handler(req, res) {
  const connection = await connect();
  const data =
    parseInt(req.query.time) > 0
      ? (await connection.query("SELECT * FROM historicalPlayers")).map((e) => {
          e.value = e.value / 1000000;
          return e;
        })
      : (await connection.query("SELECT * FROM players")).map((e) => {
          e.value = e.value / 1000000;
          return e;
        });
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
          "Picture Url": "pictureUrl",
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

  connection.end();
}
