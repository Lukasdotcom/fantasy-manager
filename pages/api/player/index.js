import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";
// Used to return a list of UIDs of players that are searched for
export default async function handler(req, res) {
  if (req.method == "GET") {
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
      parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    // Creates the sql for all the positions
    let positions = ["att", "mid", "def", "gk"];
    if (req.query.positions != undefined) {
      positions =
        JSON.parse(req.query.positions).forEach != undefined
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
    // Checks if non existant players should be shown
    const showHidden = Boolean(req.query.showHidden);
    // Gets the value to order by
    const order_by = [
      "value",
      "total_points",
      "average_points",
      "last_match",
    ].includes(req.query.order_by)
      ? req.query.order_by
      : "value";
    res.status(200).json(
      await new Promise(async (resolve) => {
        const session = await getSession({ req });
        resolve(
          await connection.query(
            `SELECT uid FROM players WHERE${
              showHidden
                ? ""
                : " (`exists`=1 OR EXISTS (SELECT * FROM squad WHERE squad.playeruid=players.uid AND user=? AND leagueID=?)) AND"
            } (name like ? OR nameAscii like ?) AND club like ? ${positionsSQL} ORDER BY ${order_by} DESC LIMIT ${limit}`,
            showHidden
              ? [searchTerm, searchTerm, clubSearch]
              : [
                  session ? session.user.id : "",
                  req.query.league,
                  searchTerm,
                  searchTerm,
                  clubSearch,
                ]
          )
        );
        // Organizes the data in a list instead of a list of dictionaries
      }).then((e) => {
        return e.map((val) => val.uid);
      })
    );
    connection.end();
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
