import connect from "./database";

/**
 * Archives a league by updating the archived timestamp in the leagueSettings table and deleting invites for the league.
 *
 * @param {string} league - The ID of the league to archive.
 */
export const archive_league = async (league: number) => {
  const connection = await connect();
  await connection.query(
    "UPDATE leagueSettings SET archived=? WHERE leagueID=?",
    [Math.floor(Date.now() / 1000), league],
  );
  await connection.query("DELETE FROM invite WHERE leagueID=?", [league]);
  connection.end();
};
