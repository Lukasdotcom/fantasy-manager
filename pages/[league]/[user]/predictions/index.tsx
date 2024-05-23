import connect from "#/Modules/database";
import redirect from "#/Modules/league";
import Menu from "../../../../components/Menu";
import { leagueSettings } from "#/types/database";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { TranslateContext } from "#/Modules/context";
import { useContext } from "react";
import { FormLabel, Grid, Pagination, PaginationItem } from "@mui/material";
import { useRouter } from "next/router";
import { Game, get_predictions, predictions } from "../../predictions";

export default function HistoricalView({
  user,
  predictions,
  username,
  latestMatchday,
  leagueSettings,
  currentMatchday,
}: {
  user: number;
  predictions: predictions[];
  username: string;
  latestMatchday: number;
  leagueSettings: leagueSettings;
  currentMatchday: number;
}) {
  const t = useContext(TranslateContext);
  const router = useRouter();
  const { leagueName, leagueID } = leagueSettings;
  return (
    <>
      <Head>
        <title>
          {t("{username}'s predictions {matchday} from {leagueName}", {
            username,
            matchday:
              currentMatchday === 0
                ? ""
                : t("on matchday {currentMatchday}", { currentMatchday }),
            leagueName,
          })}
        </title>
      </Head>
      <Menu league={leagueID} />
      <h1>
        {t("{username}'s predictions {matchday} from {leagueName}", {
          username,
          matchday:
            currentMatchday === 0
              ? ""
              : t("on matchday {currentMatchday}", { currentMatchday }),
          leagueName,
        })}
      </h1>
      <Grid container spacing={2}>
        {predictions.map((e) => (
          <Grid key={e.home_team} item lg={4} xs={6}>
            <Game league={leagueID} readOnly={true} {...e} />
          </Grid>
        ))}
      </Grid>
      <FormLabel id="matchdayLabel">{t("Select matchday")}</FormLabel>
      <Pagination
        page={currentMatchday == 0 ? latestMatchday + 1 : currentMatchday}
        count={latestMatchday + 1}
        onChange={(e, v) => {
          router.push(
            `/${leagueID}/${user}/predictions/${v === latestMatchday + 1 ? "" : v}`,
          );
        }}
        renderItem={(item) => {
          let page: number | string | null = item.page;
          if (item.page === null || item.page > latestMatchday) {
            page = t("Latest");
          }
          return <PaginationItem {...item} page={page} />;
        }}
      ></Pagination>
    </>
  );
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
    get_predictions(connection, user, league),
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
    currentMatchday: 0,
  });
};
