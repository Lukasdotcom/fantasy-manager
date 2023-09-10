import connect from "./database";

/**
+ * Deletes a user from a league and performs related cleanup tasks.
+ *
+ * @param {number} league - The ID of the league from which the user will be removed.
+ * @param {number} user - The ID of the user to be removed from the league.
+ * @return {Promise<void>} A promise that resolves once the user has been removed
+ */
export async function leaveLeague(league: number, user: number): Promise<void> {
  const connection = await connect();
  await connection.query(
    "DELETE FROM leagueUsers WHERE leagueID=? and user=?",
    [league, user],
  );
  await connection.query("DELETE FROM points WHERE leagueID=? and user=?", [
    league,
    user,
  ]);
  await connection.query("DELETE FROM squad WHERE leagueID=? and user=?", [
    league,
    user,
  ]);
  await connection.query(
    "DELETE FROM historicalSquad WHERE leagueID=? AND user=?",
    [league, user],
  );
  await connection.query(
    "DELETE FROM historicalTransfers WHERE leagueID=? and (buyer=? and seller=0) OR (seller=? and buyer=0) ",
    [league, user, user],
  );
  await connection.query(
    "UPDATE transfers SET seller='0' WHERE leagueID=? and seller=?",
    [league, user],
  );
  await connection.query(
    "UPDATE transfers SET buyer='0' WHERE leagueID=? and buyer=?",
    [league, user],
  );
  console.log(`User ${user} left league ${league}`);
  // Checks if the league still has users
  const isEmpty = await connection
    .query("SELECT * FROM leagueUsers WHERE leagueID=?", [league])
    .then((res) => res.length == 0);
  if (isEmpty) {
    connection.query("DELETE FROM invite WHERE leagueID=?", [league]);
    connection.query("DELETE FROM transfers WHERE leagueID=?", [league]);
    connection.query("DELETE FROM leagueSettings WHERE leagueId=?", [league]);
    connection.query("DELETE FROM historicalTransfers WHERE leagueID=?", [
      league,
    ]);
    connection.query("DELETE FROM historicalSquad WHERE leagueID=?", [league]);
    connection.query("DELETE FROM announcements WHERE leagueID=?", [league]);
    console.log(`League ${league} is now empty and is being deleted`);
  }
  connection.end();
}
