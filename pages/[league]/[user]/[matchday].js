import connect from "../../../Modules/database.mjs";
import redirect from "../../../Modules/league";
import HistoricalView from "./index.js";
export default function Home(props) {
  return <HistoricalView {...props} />;
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  const user = ctx.params.user;
  const league = ctx.params.league;
  const matchday = ctx.params.matchday;
  // Checks if the matchday exists
  const timeData = await connection.query(
    "SELECT * FROM points WHERE matchday=?",
    [matchday]
  );
  if (timeData.length === 0) {
    return {
      notFound: true,
    };
  }
  // Gets the latest squad of the user
  const squad = await connection.query(
    "SELECT * FROM historicalSquad WHERE leagueID=? AND user=? AND matchday=?",
    [league, user, matchday]
  );
  // Calculates the timestamp for this matchday
  const time = timeData[0].time;
  const [transfers, username, latestMatchday, money] = await Promise.all([
    // Gets all transfers at the moment from the user
    connection.query(
      "SELECT * FROM historicalTransfers WHERE leagueID=? AND matchday=? AND (buyer=? OR seller=?)",
      [league, matchday, user, user]
    ),
    // Gets the username of the user
    connection
      .query("SELECT username FROM users WHERE id=?", [user])
      .then((e) => (e.length > 0 ? e[0].username : "")),
    // Gets the latest matchday in that league
    connection
      .query(
        "SELECT matchday FROM points WHERE leagueID=? and user=? ORDER BY matchday DESC",
        [league, user]
      )
      .then((res) => (res.length > 0 ? res[0].matchday : 0)),
    // Gets the league name
    connection
      .query(
        "SELECT money FROM points WHERE leagueID=? and user=? and matchday=?",
        [league, user, matchday]
      )
      .then((res) => (res.length > 0 ? res[0].money : 0)),
  ]);
  connection.end();
  // Checks if the user exists
  if (username === "") {
    return {
      notFound: true,
    };
  }
  return await redirect(ctx, {
    user,
    username,
    squad,
    transfers,
    league,
    latestMatchday,
    currentMatchday: matchday,
    time,
    money,
  });
}
