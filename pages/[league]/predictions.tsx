import Head from "next/head";
import Menu from "#components/Menu";
import { NotifyContext, TranslateContext } from "#/Modules/context";
import connect, { connection } from "#/Modules/database";
import { leagueSettings } from "#/types/database";
import { useContext, useEffect, useState } from "react";
import redirect from "#/Modules/league";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { Alert, AlertTitle, Grid, TextField } from "@mui/material";
import { checkUpdate } from "#/scripts/checkUpdate";
export interface predictions {
  home_team: string;
  home_team_name: string | undefined;
  away_team: string;
  away_team_name: string | undefined;
  home_score?: number;
  away_score?: number;
  gameStart: number;
  gameEnd: number;
  home_prediction?: number;
  away_prediction?: number;
}
interface GameProps extends predictions {
  league: number;
  readOnly?: boolean;
}
export function Game({
  home_team,
  home_team_name,
  away_team,
  away_team_name,
  home_score,
  away_score,
  gameStart,
  gameEnd,
  home_prediction,
  away_prediction,
  league,
  // This is used to mean an outside viewer that should only see the prediction when the game starts
  readOnly = false,
}: GameProps) {
  // const t = useContext(TranslateContext);
  const [home, setHome] = useState(home_prediction);
  const [away, setAway] = useState(away_prediction);
  const notify = useContext(NotifyContext);
  function updateHome(e: React.ChangeEvent<HTMLInputElement>) {
    setHome(parseInt(e.target.value));
    save(parseInt(e.target.value), away);
  }
  function updateAway(e: React.ChangeEvent<HTMLInputElement>) {
    setAway(parseInt(e.target.value));
    save(home, parseInt(e.target.value));
  }
  function save(home: number | undefined, away: number | undefined) {
    notify(t("Saving"));
    fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        home_team,
        away_team,
        league,
        home,
        away,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
    });
  }
  const [countdown, setCountown] = useState<number>(
    Math.ceil((gameStart - Date.now() / 1000) / 60),
  );
  useEffect(() => {
    const id = setInterval(
      () => setCountown((countdown) => countdown - 1),
      60000,
    );
    return () => {
      clearInterval(id);
    };
  }, []);
  const t = useContext(TranslateContext);
  home_team = home_team_name || home_team;
  away_team = away_team_name || away_team;
  return (
    <div>
      <h2>
        {countdown > 0
          ? t("{home_team} - {away_team} in {day} D {hour} H {minute} M ", {
              home_team,
              away_team,
              day: Math.floor(countdown / 60 / 24),
              hour: Math.floor(countdown / 60) % 24,
              minute: Math.floor(countdown) % 60,
            })
          : `${home_team} - ${away_team}`}
      </h2>
      {countdown > 0 && (
        <>
          {!readOnly && (
            <>
              <TextField
                label={t("Home Prediction")}
                type="number"
                value={home ?? ""}
                onChange={updateHome}
              />
              <TextField
                label={t("Away Prediction")}
                type="number"
                value={away ?? ""}
                onChange={updateAway}
              />
            </>
          )}
          {readOnly && (
            <>
              <h4>{t("Predictions")}</h4>
              <p>
                {home_prediction} - {away_prediction}
              </p>
            </>
          )}
        </>
      )}
      {countdown <= 0 && (
        <>
          {home_prediction !== null && away_prediction !== null && (
            <>
              <h4>{t("Predictions")}</h4>
              <p>
                {home_prediction} - {away_prediction}
              </p>
            </>
          )}
          <h4>
            {Date.now() / 1000 > gameEnd
              ? t("Final Scores")
              : t("Current Scores")}
          </h4>
          <p>
            {home_score} - {away_score}
          </p>
        </>
      )}
    </div>
  );
}
export default function Home({
  games,
  league,
  leagueSettings,
}: {
  games: predictions[];
  league: number;
  leagueSettings: leagueSettings;
}) {
  const { archived, leagueName, predictionsEnabled } = leagueSettings;
  const t = useContext(TranslateContext);
  if (archived !== 0) {
    return (
      <>
        <Head>
          <title>{t("Predictions for {leagueName}", { leagueName })}</title>
        </Head>
        <Menu league={league} />
        <h1>{t("Predictions for {leagueName}", { leagueName })}</h1>
        <Alert severity={"warning"} className="notification">
          <AlertTitle>{t("This league is archived")}</AlertTitle>
          <p>{t("This league is archived and this screen is disabled. ")}</p>
        </Alert>
      </>
    );
  } else if (!predictionsEnabled) {
    return (
      <>
        <Head>
          <title>
            {t("Predictions for {leagueName}", {
              leagueName,
            })}
          </title>
        </Head>
        <Menu league={league} />
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
  return (
    <>
      <Head>
        <title>{t("Predictions for {leagueName}", { leagueName })}</title>
      </Head>
      <Menu league={league} />
      <h1>{t("Predictions for {leagueName}", { leagueName })}</h1>
      <br />
      <Grid container spacing={2}>
        {games.map((e) => (
          <Grid key={e.home_team} item lg={4} xs={6}>
            <Game league={league} {...e} />
          </Grid>
        ))}
      </Grid>
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
 * @param {number} [matchday] - The optional matchday number.
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
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const connection = await connect();
  const user_id = (await getSession(ctx))?.user?.id;
  const games: predictions[] = await get_predictions(
    connection,
    user_id as number,
    parseInt(String(ctx.query.league)),
    checkUpdate,
  );
  connection.end();
  return await redirect(ctx, { games });
};
