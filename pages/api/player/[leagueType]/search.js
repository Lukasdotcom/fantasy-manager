import { cache } from "../../../../Modules/cache";
import connect from "../../../../Modules/database";
// Used to return a list of UIDs of players that are searched for
export default async function handler(req, res) {
  if (req.method == "GET") {
    const league = req.query.leagueType;
    const connection = await connect();
    // Gets the search term
    let searchTerm =
      req.query.searchTerm != undefined ? req.query.searchTerm : "";
    searchTerm = `%${searchTerm}%`;
    // Gets the club search term
    let clubSearch =
      req.query.clubSearch != undefined ? req.query.clubSearch : "";
    clubSearch = `%${clubSearch}%`;
    // Used to get the number of players to max out the search results to
    const limit =
      parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 50;
    // Creates the sql for all the positions
    let positions = ["att", "mid", "def", "gk"];
    if (req.query.positions != undefined) {
      positions = Array.isArray(JSON.parse(req.query.positions))
        ? JSON.parse(req.query.positions)
        : positions;
    }
    let positionsSQL = "";
    positions.forEach((e) => {
      if (["att", "mid", "def", "gk"].includes(e)) {
        positionsSQL += `position='${e}' OR `;
      }
    });
    if (positionsSQL != "") {
      positionsSQL = `AND (${positionsSQL.slice(0, -4)})`;
    }
    // Gets the value to order by
    const order_by = [
      "value",
      "total_points",
      "average_points",
      "last_match",
    ].includes(req.query.order_by)
      ? req.query.order_by
      : "value";
    // If this is the production server caching is done on all requests
    if (
      process.env.APP_ENV !== "development" &&
      process.env.APP_ENV !== "test"
    ) {
      res.setHeader("Cache-Control", `public, max-age=${await cache(league)}`);
    }
    res.status(200).json(
      await new Promise(async (resolve) => {
        resolve(
          await connection.query(
            `SELECT uid FROM players WHERE (name like ? OR nameAscii like ?) AND club like ? ${positionsSQL} AND value>=? AND value<=? AND league=? ORDER BY ${order_by} DESC LIMIT ${limit}`,
            [
              searchTerm,
              searchTerm,
              clubSearch,
              parseInt(req.query.minPrice) > 0
                ? parseInt(req.query.minPrice)
                : 0,
              // Checks if the max price is greater than or equal to 0 otherwise sets it to the maximum int possible
              parseInt(req.query.maxPrice) >= 0
                ? parseInt(req.query.maxPrice)
                : Number.MAX_SAFE_INTEGER,
              league,
            ],
          ),
        );
        // Organizes the data in a list instead of a list of dictionaries
      }).then((e) => {
        return e.map((val) => val.uid);
      }),
    );
    connection.end();
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
