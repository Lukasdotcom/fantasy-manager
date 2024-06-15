import connect from "#/Modules/database";
import redirect from "#/Modules/league";
import { leagueSettings } from "#/types/database";
import { GetServerSideProps } from "next";
import HistoricalView, { get_predictions } from ".";
import { predictions } from "#/components/Prediction";

export default function Home(props: {
  user: number;
  predictions: predictions[];
  username: string;
  latestMatchday: number;
  leagueSettings: leagueSettings;
  currentMatchday: number;
}) {
  return <HistoricalView {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const connection = await connect();
  const user = parseInt(String(ctx.params?.user));
  const league = parseInt(String(ctx.params?.league));
  const [predictions, username, latestMatchday]: [
    predictions[],
    string,
    number,
  ] = await Promise.all([
    // Gets the latest predictions for the user
    get_predictions(connection, user, league, undefined, -1),
    // Gets the username of the user
    connection
      .query("SELECT username FROM users WHERE id=?", [user])
      .then((e) => (e.length > 0 ? e[0].username : "")),
    // Gets the latest matchday in that league
    connection
      .query(
        "SELECT matchday FROM points WHERE leagueID=? and user=? AND time IS NOT NULL ORDER BY matchday DESC",
        [league, user],
      )
      .then((res) => (res.length > 0 ? res[0].matchday : 0)),
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
    predictions,
    username,
    latestMatchday,
    currentMatchday: -1,
  });
};
