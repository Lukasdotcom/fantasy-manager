import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getSession } from "next-auth/react";
import connect, { leagueSettings } from "./database";
// Used to get information about the redirect for the league runs on every league page
const redirect = async (
  ctx: GetServerSidePropsContext,
  data: { [key: string]: any }
): Promise<GetServerSidePropsResult<{ [key: string]: any }>> => {
  const league = parseInt(String(ctx.params?.league));
  const session = await getSession(ctx);
  const connection = await connect();
  if (session) {
    // Checks if the user is in the league or not
    const leagueInfo: leagueSettings[] = await connection.query(
      "SELECT * FROM leagueSettings WHERE leagueID=? and EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
      [league, session.user.id]
    );
    connection.end();
    if (leagueInfo.length > 0) {
      return {
        props: {
          ...data,
          league: league,
          leagueName: leagueInfo[0].leagueName,
          leagueType: leagueInfo[0].league,
          archived: leagueInfo[0].archived,
        },
      };
    } else {
      return {
        notFound: true,
      };
    }
  } else {
    // If the user is not logged in it checks if the league exists
    const leagueExists = await connection
      .query("SELECT * FROM leagueSettings WHERE leagueID=?", [league])
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
};
export default redirect;
