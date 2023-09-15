import connect, {
  leagueSettings,
  leagueUsers,
  points,
  position,
} from "../Modules/database";

async function top11(userID: number, leagueID: number) {
  const connection = await connect();
  const formation = JSON.parse(
    await connection
      .query("SELECT formation FROM leagueUsers WHERE leagueID=? AND user=?", [
        leagueID,
        userID,
      ])
      .then((e) => e[0].formation),
  );
  // Moves all players off the field
  await connection.query(
    `UPDATE squad SET position=(SELECT position FROM players WHERE players.uid=squad.playeruid) WHERE leagueID=? AND user=?`,
    [leagueID, userID],
  );
  const players: { playeruid: string; position: position; points: number }[] =
    await connection.query(
      "SELECT squad.playeruid, players.position, players.last_match+players.last_match*starred AS points FROM squad LEFT OUTER JOIN players ON players.uid=squad.playeruid WHERE user=1 AND leagueID=21 ORDER BY players.position, points DESC;",
    );
  const parts = ["gk", "def", "mid", "att"];
  // Goes through every character and moves them to the correct position
  for (const player of players) {
    const position = parts.indexOf(player.position);
    console.log(formation[position]);
    if (formation[position] > 0) {
      await connection.query(
        "UPDATE squad SET position=? WHERE playeruid=? AND leagueID=? AND user=?",
        [player.position, player.playeruid, leagueID, userID],
      );
      formation[position]--;
    } else {
      console.log("BENCH FOR " + player.playeruid);
      await connection.query(
        "UPDATE squad SET position='bench' WHERE playeruid=? AND leagueID=? AND user=?",
        [player.playeruid, leagueID, userID],
      );
    }
  }
  connection.end();
}
/**
 * Calculates and updates the points for the specified league.
 *
 * @param {string | number} league - The league type or leagueID.
 */
export async function calcPoints(league: string | number) {
  const connection = await connect();
  let leagueID: false | number = false;
  // Checks if a league number was requested instead of an entire league type
  if (parseInt(String(league)) > 0) {
    const leagueData: leagueSettings[] = await connection.query(
      "SELECT * FROM leagueSettings WHERE leagueID=? AND archived=0",
      [league],
    );
    if (leagueData.length > 0) {
      leagueID = leagueData[0].leagueID;
      league = leagueData[0].league;
    }
  }
  // Makes sure that the transfer season is running
  if (
    await connection
      .query("SELECT value2 FROM data WHERE value1=?", [
        "transferOpen" + league,
      ])
      .then((result) => (result.length > 0 ? result[0].value2 == "true" : true))
  ) {
    connection.end();
    return;
  }
  console.log(
    `Calculating user points for ${
      leagueID ? `leagueID ${leagueID} in the ` : ""
    }${league}`,
  );
  const leagueUsers: leagueUsers[] = leagueID
    ? await connection.query(
        "SELECT leagueID, user, points FROM leagueUsers WHERE leagueID=?",
        [leagueID],
      )
    : await connection.query(
        "SELECT leagueID, user, points FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE league=? AND leagueSettings.leagueID=leagueUsers.leagueID AND EXISTS (SELECT * FROM points WHERE leagueUsers.leagueID=points.leagueID AND time IS NULL)) ORDER BY leagueID",
        [league],
      );
  let index = 0;
  let currentleagueID = -1;
  let matchday = 1;
  while (index < leagueUsers.length) {
    const e = leagueUsers[index];
    index++;
    // Moves top 11 players when needed
    if (
      await connection
        .query("SELECT * FROM leagueSettings WHERE leagueID=? AND top11=1", [
          e.leagueID,
        ])
        .then((e) => e.length > 0)
    ) {
      await top11(e.user, e.leagueID);
    }
    const [oldPoints, newPoints] = await Promise.all([
      // Gets how many points the user had for the matchday with the previous calculation
      connection
        .query(
          "SELECT points FROM points WHERE leagueID=? AND user=? AND time IS NULL ORDER BY matchday DESC LIMIT 1",
          [e.leagueID, e.user],
        )
        .then((result: points[]) => (result.length > 0 ? result[0].points : 0)),
      // Calculates the amont of points the user should have for the matchday
      new Promise<number>(async (res) => {
        res(
          // Calculates points for non starred players
          (await connection
            .query(
              "SELECT SUM(last_match) FROM players WHERE EXISTS (SELECT * FROM squad WHERE squad.playeruid=players.uid AND position!='bench' AND leagueID=? AND user=? AND starred=0)",
              [e.leagueID, e.user],
            )
            .then((result: number[]) => {
              const value = Object.values(result[0])[0];
              return value ? value : 0;
            })) +
            // Calculates points for starred players
            Math.ceil(
              (await connection
                .query(
                  "SELECT SUM(last_match) FROM players WHERE EXISTS (SELECT * FROM squad WHERE squad.playeruid=players.uid AND position!='bench' AND leagueID=? AND user=? AND starred=1)",
                  [e.leagueID, e.user],
                )
                .then((result: number[]) => {
                  const value = Object.values(result[0])[0];
                  return value ? value : 0;
                })) *
                (await connection
                  .query(
                    "SELECT starredPercentage FROM leagueSettings WHERE leagueID=?",
                    [e.leagueID],
                  )
                  .then((res: leagueSettings[]) =>
                    res.length > 0 ? res[0].starredPercentage / 100 : 1.5,
                  )),
            ),
        );
      }),
    ]);
    // Checks if the point amount has changed and if they are different they are updated
    if (oldPoints !== newPoints) {
      // Checks if the matchday might be different
      if (e.leagueID !== currentleagueID) {
        currentleagueID = e.leagueID;
        // Calculates the latest matchday for that league
        matchday = await connection
          .query(
            "SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1",
            [currentleagueID],
          )
          .then((result) => (result.length > 0 ? result[0].matchday : 1));
      }
      connection.query(
        "UPDATE points SET points=? WHERE leagueID=? AND user=? AND matchday=?",
        [newPoints, e.leagueID, e.user, matchday],
      );
      connection.query(
        "UPDATE leagueUsers SET points=? WHERE leagueID=? AND user=?",
        [e.points - oldPoints + newPoints, e.leagueID, e.user],
      );
    }
  }
  console.log(
    `Updated user points for ${
      leagueID ? `leagueID ${leagueID} in the ` : ""
    }${league}`,
  );
  connection.end();
  return;
}
