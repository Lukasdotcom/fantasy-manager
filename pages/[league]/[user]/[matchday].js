import connect from "../../../Modules/database";
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
    "SELECT * FROM points WHERE matchday=? AND leagueID=?",
    [matchday, league],
  );
  if (timeData.length === 0) {
    return {
      notFound: true,
    };
  }
  // Calculates the timestamp for this matchday
  const time = timeData[0].time;
  const [transfers, username, latestMatchday, money] = await Promise.all([
    // Gets all transfers at the moment from the user
    connection.query(
      "SELECT * FROM historicalTransfers WHERE leagueID=? AND matchday=? AND (buyer=? OR seller=?)",
      [league, matchday, user, user],
    ),
    // Gets the username of the user
    connection
      .query("SELECT username FROM users WHERE id=?", [user])
      .then((e) => (e.length > 0 ? e[0].username : "")),
    // Gets the latest matchday in that league
    connection
      .query(
        "SELECT matchday FROM points WHERE leagueID=? and user=? ORDER BY matchday DESC",
        [league, user],
      )
      .then((res) => (res.length > 0 ? res[0].matchday : 0)),
    // Gets the money
    connection
      .query(
        "SELECT money FROM points WHERE leagueID=? and user=? and matchday=?",
        [league, user, matchday],
      )
      .then((res) => (res.length > 0 ? res[0].money : 0)),
  ]);
  // Checks if this matchday was finished
  const historicalSquadExists = !!time;
  // Gets the squad of the user on that matchday
  const squad = historicalSquadExists
    ? await connection.query(
        "SELECT * FROM historicalSquad WHERE leagueID=? AND user=? AND matchday=?",
        [league, user, matchday],
      )
    : await connection.query(
        "SELECT * FROM squad WHERE leagueID=? AND user=?",
        [league, user],
      );
  // Calculates the value of the squad
  const values = await Promise.all(
    squad.map((e) =>
      connection
        .query(
          "SELECT value FROM players WHERE uid=? AND league=(SELECT league FROM leagueSettings WHERE leagueID=?)",
          [e.playeruid, league],
        )
        .then((e) => (e.length > 0 ? e[0].value : 0)),
    ),
  );
  let value = money;
  values.forEach((e) => {
    value += e;
  });
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
    time: historicalSquadExists ? time : null,
    money,
    value,
  });
}
