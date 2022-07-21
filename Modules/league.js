import { getSession } from "next-auth/react";
import connect from "./database.mjs";
// Used to get information about the redirect for the league runs on every league page
export default async function redirect(ctx, data) {
  const league = ctx.params.league;
  const session = await getSession(ctx);
  const connection = await connect();
  if (session) {
    // Checks if the user is in the league or not
    const leagueInfo = await connection
      .query(
        "SELECT * FROM leagueSettings WHERE leagueID=? and EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
        [league, session.user.id]
      )
    connection.end();
    if (leagueInfo.length > 0) {
      return {
        props: {
          ...data,
          league: league,
          leagueName: leagueInfo[0].leagueName,
        },
      };
    } else {
      return {
        notFound: true,
      };
    }
  } else {
    const leagueExists = await connection
      .query("SELECT * FROM leagueSettings WHERE leagueID=?", [
        league,
        session.user.id,
      ])
      .then((res) => res.length > 0);
    connection.end();
    if (leagueExists) {
      // Makes sure to redirect a user that is not logged in but went to a valid league to a login
      return {
        redirect: {
          destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
            ctx.resolvedUrl
          )}`,
          permanent: false,
        },
      };
    } else {
      return {
        notFound: true,
      };
    }
  }
}
