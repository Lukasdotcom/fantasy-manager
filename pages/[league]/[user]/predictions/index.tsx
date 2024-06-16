import connect, { connection } from "#/Modules/database";
import redirect from "#/Modules/league";
import Menu from "../../../../components/Menu";
import { leagueSettings } from "#/types/database";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { TranslateContext } from "#/Modules/context";
import { useContext } from "react";
import {
  Alert,
  AlertTitle,
  FormLabel,
  Grid,
  Pagination,
  PaginationItem,
} from "@mui/material";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { checkUpdate } from "#/scripts/checkUpdate";
import { Game, predictions } from "#/components/Prediction";

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
  const { leagueName, leagueID, archived, predictionsEnabled } = leagueSettings;
  const session = useSession();
  const current_userid = session.data?.user?.id;
  if (!predictionsEnabled) {
    return (
      <>
        <Head>
          <title>
            {t("Predictions for {leagueName}", {
              leagueName,
            })}
          </title>
        </Head>
        <Menu league={leagueID} />
        <h1>
          {t("Predictions for {leagueName}", {
            leagueName,
          })}
        </h1>
        <Alert severity={"warning"} className="notification">
          <AlertTitle>{t("Predictions are Disabled")}</AlertTitle>
          <p>{t("Predictions must be enabled in the league to use this. ")}</p>
        </Alert>
      </>
    );
  }
  let title_text = t("{username}'s predictions {matchday} from {leagueName}", {
    username,
    matchday:
      currentMatchday === 0
        ? ""
        : t("on matchday {currentMatchday}", { currentMatchday }),
    leagueName,
  });
  if (currentMatchday === -1) {
    title_text = t("{username}'s future predictions for {leagueName}", {
      username,
      leagueName,
    });
  }
  return (
    <>
      <Head>
        <title>{title_text}</title>
      </Head>
      <Menu league={leagueID} />
      <h1>{title_text}</h1>
      <Grid container spacing={2}>
        {predictions.map((e) => (
          <Grid key={e.home_team} item lg={4} xs={6}>
            <Game
              league={leagueID}
              readOnly={user !== current_userid || !!archived}
              {...e}
            />
          </Grid>
        ))}
      </Grid>
      <FormLabel id="matchdayLabel">{t("Select matchday")}</FormLabel>
      <Pagination
        page={
          currentMatchday == 0
            ? latestMatchday + 1
            : currentMatchday == -1
              ? latestMatchday + 2
              : currentMatchday
        }
        count={latestMatchday + 2}
        onChange={(e, v) => {
          if (v === latestMatchday + 1) {
            router.push(`/${leagueID}/${user}/predictions`);
          } else if (v > latestMatchday + 1) {
            router.push(`/${leagueID}/${user}/predictions/future`);
          } else {
            router.push(`/${leagueID}/${user}/predictions/${v}`);
          }
        }}
        renderItem={(item) => {
          let page: number | string | null = item.page;
          if (item.page === null || item.page == latestMatchday + 1) {
            page = t("Latest");
          } else if (item.page === null || item.page > latestMatchday + 1) {
            page = t("Future");
          }
          return <PaginationItem {...item} page={page} />;
        }}
      ></Pagination>
    </>
  );
}
/**
 * Retrieves predictions for a given league and matchday.
 *
 * @param {connection} connection - The database connection.
 * @param {number} user - The user ID.
 * @param {number} league - The league ID.
 * @param {(league: string) => Promise<void>} [checkUpdate] - The optional checkUpdate function located at #/scripts/checkUpdate. Doesn't like being imported in here.
 * @param {number} [matchday] - The optional matchday number. If set to -1 then the future will be grabbed.
 * @return {Promise<predictions[]>} An array of all the predictions that the user had
 */
export const get_predictions = async (
  connection: connection,
  user: number,
  league: number,
  checkUpdate?: (league: string) => Promise<void>,
  matchday?: number,
): Promise<predictions[]> => {
  const leagueType: string = await connection
    .query("SELECT league FROM leagueSettings WHERE leagueID=?", [league])
    .then((e) => (e.length > 0 ? e[0].league : ""));
  if (checkUpdate) checkUpdate(leagueType);
  // Gets future predictions if matchday is -1
  if (matchday === -1) {
    return await connection.query(
      `SELECT 
        futureClubs.club as home_team,
        futureClubs.fullName as home_team_name,
        futureClubs.opponent as away_team, 
        opponent.fullName as away_team_name,
        futureClubs.gameStart as gameStart,
        99999999999 as gameEnd,
        futurePredictions.home AS home_prediction, 
        futurePredictions.away AS away_prediction 
      FROM 
        futureClubs 
        LEFT OUTER JOIN futurePredictions ON futurePredictions.club = futureClubs.club
        AND futurePredictions.league = ? 
        AND futurePredictions.user = ?
        AND futurePredictions.leagueID = ?
        AND futurePredictions.gameStart = futureClubs.gameStart
        LEFT OUTER JOIN futureClubs AS opponent ON opponent.club = futureClubs.opponent
        AND opponent.league = futureClubs.league
        AND opponent.gameStart = futureClubs.gameStart
      WHERE 
        futureClubs.home = 1 
        AND futureClubs.league = ?
      ORDER BY
        gameStart`,
      [leagueType, user, league, leagueType],
    );
  }
  if (matchday) {
    const time = await connection
      .query("SELECT time FROM points WHERE matchday=? AND leagueID=?", [
        matchday,
        league,
      ])
      .then((e) => (e.length > 0 ? e[0].time : 0));
    return await connection.query(
      `SELECT 
        historicalClubs.club as home_team,
        historicalClubs.fullName as home_team_name,
        historicalClubs.opponent as away_team, 
        opponent.fullName as away_team_name,
        historicalClubs.teamScore AS home_score, 
        historicalClubs.opponentScore AS away_score, 
        0 as gameStart,
        0 as gameEnd,
        historicalPredictions.home AS home_prediction, 
        historicalPredictions.away AS away_prediction 
      FROM 
        historicalClubs 
        LEFT OUTER JOIN historicalPredictions ON historicalPredictions.club = historicalClubs.club 
        AND historicalPredictions.matchday = ?
        AND historicalPredictions.league = ?
        AND historicalPredictions.user = ?
        AND historicalPredictions.leagueID = ?
        LEFT OUTER JOIN historicalClubs AS opponent ON opponent.club = historicalClubs.opponent
        AND opponent.league = historicalClubs.league
        AND opponent.time = historicalClubs.time
      WHERE 
        historicalClubs.home = 1 
        AND historicalClubs.league = ?
        AND historicalClubs.time = ?
      ORDER BY
        gameStart`,
      [matchday, leagueType, user, league, leagueType, time],
    );
  }
  return await connection.query(
    `SELECT 
      clubs.club as home_team,
      clubs.fullName as home_team_name,
      clubs.opponent as away_team, 
      opponent.fullName as away_team_name,
      clubs.teamScore AS home_score, 
      clubs.opponentScore AS away_score, 
      clubs.gameStart as gameStart,
      clubs.gameEnd as gameEnd,
      predictions.home AS home_prediction, 
      predictions.away AS away_prediction 
    FROM 
      clubs 
      LEFT OUTER JOIN predictions ON predictions.club = clubs.club
      AND predictions.league = ? 
      AND predictions.user = ?
      AND predictions.leagueID = ?
      LEFT OUTER JOIN clubs AS opponent ON opponent.club = clubs.opponent
      AND opponent.league = clubs.league
    WHERE 
      clubs.home = 1 
      AND clubs.league = ?
    ORDER BY
      gameStart`,
    [leagueType, user, league, leagueType],
  );
};
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
    get_predictions(connection, user, league, checkUpdate),
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
