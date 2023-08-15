import connect, { players } from "#/Modules/database";
import { stringify } from "csv-stringify/sync";
import { NextApiRequest, NextApiResponse } from "next";
interface returnType extends players {
  pictureUrl: string;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const connection = await connect();
  let extraText = "";
  const league = req.query.league as string;
  if (
    (
      await connection.query(
        "SELECT * FROM plugins WHERE name=? AND enabled=1",
        [league],
      )
    ).length == 0
  ) {
    res.status(404).end("League does not exist");
    return;
  }
  // Checks if the player wants to show all the hidden ones
  if (req.query.showHidden !== "true") {
    extraText += " AND `exists`=1";
  }
  if (typeof req.query.time !== "string" && req.query.time !== undefined) {
    res.status(400).end("Invalid time");
    return;
  }
  const time = req.query.time ? parseInt(req.query.time) : 0;
  const filter_function = (e: players) => {
    e.value = e.value / 1000000;
    e.sale_price = e.sale_price / 1000000;
    return {
      ...e,
      pictureUrl:
        process.env.NEXTAUTH_URL +
        "/_next/image?url=%2Fapi%2Fpicture%2F" +
        e.pictureID +
        "&w=256&q=75",
    };
  };
  const data: returnType[] =
    time > 0
      ? (
          await connection.query(
            `SELECT * FROM historicalPlayers WHERE league=?${extraText}`,
            [league],
          )
        ).map(filter_function)
      : (
          await connection.query(
            `SELECT * FROM players WHERE league=?${extraText}`,
            [league],
          )
        ).map(filter_function);
  // Checks if this is a download by csv or json
  if (req.query.type === "csv") {
    res.setHeader("Content-Type", "application/csv");
    res.setHeader("Content-Disposition", "attachment; filename=players.csv");
    res.status(200).end(
      stringify([
        {
          uid: "Uid",
          name: "Name",
          nameAscii: "Ascii Name",
          club: "Club",
          pictureUrl: "Picture Url",
          value: "Value",
          sale_price: "Sale Price",
          position: "Position",
          forecast: "Forecast",
          total_points: "Total Points",
          average_points: "Average Points",
          last_match: "Last Match Points",
          exists: "Exists",
          league: "League",
        },
        ...data,
      ]),
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
      req.query.time ? parseInt(req.query.time) : "latest"
    } time and for league ${league}`,
  );
  connection.end();
}
