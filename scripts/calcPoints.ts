import connect, {
  leagueSettings,
  leagueUsers,
  points,
} from "../Modules/database";

// Used to calculate the points for every user
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
        "SELECT leagueID, user, points FROM leagueUsers WHERE EXISTS (SELECT * FROM leagueSettings WHERE leagueSettings.leagueID=leagueUsers.leagueID AND league=?) ORDER BY leagueID",
        [league],
      );
  let index = 0;
  let currentleagueID = -1;
  let matchday = 1;
  while (index < leagueUsers.length) {
    const e = leagueUsers[index];
    index++;
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
