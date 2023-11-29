/* eslint-disable @typescript-eslint/no-unused-vars */
import Head from "next/head";
import Menu from "#components/Menu";
import { NotifyContext, TranslateContext } from "#/Modules/context";
import connect, { leagueUsers } from "#/Modules/database";
import { useContext, useState } from "react";
import redirect from "#/Modules/league";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { Button, Grid, TextField } from "@mui/material";
interface predictions {
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  gameStart: number;
  gameEnd: number;
  home_prediction?: number;
  away_prediction?: number;
}
interface GameProps extends predictions {
  league: number;
}
function Game({
  home_team,
  away_team,
  home_score,
  away_score,
  gameStart,
  gameEnd,
  home_prediction,
  away_prediction,
  league,
}: GameProps) {
  // const t = useContext(TranslateContext);
  const [home, setHome] = useState(home_prediction);
  const [away, setAway] = useState(away_prediction);
  const notify = useContext(NotifyContext);
  function updateHome(e: React.ChangeEvent<HTMLInputElement>) {
    setHome(parseInt(e.target.value));
  }
  function updateAway(e: React.ChangeEvent<HTMLInputElement>) {
    setAway(parseInt(e.target.value));
  }
  function save() {
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
  const t = useContext(TranslateContext);
  return (
    <div>
      <h2>
        {home_team} - {away_team}
      </h2>
      {Date.now() / 1000 <= gameStart && (
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
          <Button variant="outlined" color="success" onClick={save}>
            {t("Save")}
          </Button>
        </>
      )}
      {Date.now() / 1000 > gameStart && (
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
  leagueName,
}: {
  games: predictions[];
  league: number;
  leagueName: string;
}) {
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("Predictions for {leagueName}", { leagueName })}</title>
      </Head>
      <Menu league={league} />
      <h1>{t("Predictions")}</h1>
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

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const connection = await connect();
  const leagueType: string = await connection
    .query("SELECT league FROM leagueSettings WHERE leagueID=?", [
      ctx.query.league,
    ])
    .then((e) => (e.length > 0 ? e[0].league : ""));
  const user_id = (await getSession(ctx))?.user?.id;
  const games: predictions[] = await connection.query(
    `SELECT 
      clubs.club as home_team, 
      clubs.opponent as away_team, 
      clubs.teamScore AS home_score, 
      clubs.opponentScore AS away_score, 
      clubs.gameStart as gameStart,
      clubs.gameEnd as gameEnd,
      predictions.home AS home_prediction, 
      predictions.away AS away_prediction 
    FROM 
      clubs 
      LEFT OUTER JOIN predictions ON predictions.club = clubs.club 
      AND predictions.league = clubs.league 
      AND predictions.user = ?
    WHERE 
      clubs.home = 1 
      AND clubs.league = ?
  `,
    [user_id, leagueType],
  );
  connection.end();
  return await redirect(ctx, { games });
};
