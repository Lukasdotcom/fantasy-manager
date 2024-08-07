import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import connect from "./database";
import { leagueSettings } from "#type/database";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { getData } from "#/pages/api/theme";
// Used to get information about the redirect for the league runs on every league page
const redirect = async (
  ctx: GetServerSidePropsContext,
  data: { [key: string]: unknown },
): Promise<GetServerSidePropsResult<{ [key: string]: unknown }>> => {
  const league = parseInt(String(ctx.params?.league));
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const connection = await connect();
  if (session) {
    // Checks if the user is in the league or not
    const leagueInfo: leagueSettings[] = await connection.query(
      "SELECT * FROM leagueSettings WHERE leagueID=? and EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)",
      [league, session.user.id],
    );
    connection.query("UPDATE leagueSettings SET active=1 WHERE leagueID=?", [
      league,
    ]);
    connection.end();
    if (leagueInfo.length > 0) {
      const transferOpen = await connection
        .query("SELECT * FROM data WHERE value1=? AND value2='true'", [
          "transferOpen" + leagueInfo[0].league,
        ])
        .then((e) => e.length > 0);
      return {
        props: {
          ...data,
          league: league,
          leagueSettings: leagueInfo[0],
          transferOpen,
          t: await getData(ctx),
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
            ctx.resolvedUrl,
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
