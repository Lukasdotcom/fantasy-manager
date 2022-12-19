import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { SquadPlayer as Player } from "../../components/Player";
import { useContext, useState } from "react";
import { push } from "@socialgouv/matomo-next";
import connect from "../../Modules/database";
import {
  Alert,
  AlertTitle,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";
import { getLeagueInfo } from "../api/squad/[league]";
import { getSession } from "next-auth/react";
import { NotifyContext, TranslateContext } from "../../Modules/context";

export default function Home({
  league,
  starredPercentage,
  leagueName,
  leagueInfo,
  leagueType,
  archived,
}) {
  const notify = useContext(NotifyContext);
  const t = useContext(TranslateContext);
  // Turns the leagueInfo data into the data for the starting state
  let players = { att: [], mid: [], def: [], gk: [], bench: [] };
  leagueInfo.players.forEach((e) => {
    players[e.position].push({
      playeruid: e.playeruid,
      starred: e.starred,
      status: e.status,
    });
  });
  const [showSelling, setShowSelling] = useState(true);
  const [squad, setSquad] = useState(players);
  const [formation, setFormation] = useState(leagueInfo.formation);
  const [validFormations, setValidFormations] = useState(
    leagueInfo.validFormations
  );
  // Checks if the league is archived
  if (archived !== 0) {
    return (
      <>
        <Head>
          <title>{t("Squad for {leagueName}", { leagueName })}</title>
        </Head>
        <Menu league={league} />
        <h1>{t("Squad for {leagueName}", { leagueName })}</h1>
        <Alert severity={"warning"} className="notification">
          <AlertTitle>{t("This league is archived")}</AlertTitle>
          <p>{t("This league is archived and this screen is disabled. ")}</p>
        </Alert>
      </>
    );
  }
  const field = {
    att: squad.att.length < formation[3],
    mid: squad.mid.length < formation[2],
    def: squad.def.length < formation[1],
    gk: squad.gk.length < formation[0],
  };
  function getSquad() {
    fetch(`/api/squad/${league}`).then(async (e) => {
      const val = await e.json();
      let players = { att: [], mid: [], def: [], gk: [], bench: [] };
      val.players.forEach((e) => {
        players[e.position].push({
          playeruid: e.playeruid,
          starred: e.starred,
          status: e.status,
        });
      });
      setFormation(val.formation);
      setSquad(players);
      setValidFormations(val.validFormations);
    });
  }
  // Checks if the player can change to the formation
  function changeToFormation(newFormation) {
    let defenders = newFormation[1] - squad["def"].length;
    let midfielders = newFormation[2] - squad["mid"].length;
    let forwards = newFormation[3] - squad["att"].length;
    return !(defenders >= 0) || !(midfielders >= 0) || !(forwards >= 0);
  }
  return (
    <>
      <Head>
        <title>{t("Squad for {leagueName}", { leagueName })}</title>
      </Head>
      <Menu league={league} />
      <h1>{t("Squad for {leagueName}", { leagueName })}</h1>
      <InputLabel htmlFor="formation">{t("Formation")}</InputLabel>
      <Select
        onChange={(e) => {
          // Used to change the formation
          let newFormation = JSON.parse(e.target.value);
          push(["trackEvent", "New Formation", JSON.stringify(newFormation)]);
          setFormation(newFormation);
          notify("Saving");
          fetch(`/api/squad/${league}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formation: newFormation,
            }),
          }).then(async (response) => {
            notify(await response.text(), response.ok ? "success" : "error");
          });
        }}
        value={JSON.stringify(formation)}
        id="formation"
      >
        {validFormations.map((val) => (
          <MenuItem
            key={JSON.stringify(val)}
            disabled={changeToFormation(val)}
            value={JSON.stringify(val)}
          >
            {val[1]}-{val[2]}-{val[3]}
          </MenuItem>
        ))}
      </Select>
      <h2>{t("Attackers")}</h2>
      {squad["att"].map(
        (
          e // Used to get the players for the attack
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            status={e.status}
            leagueType={leagueType}
          />
        )
      )}
      <h2>{t("Midfielders")}</h2>
      {squad["mid"].map(
        (
          e // Used to get the players for the mid
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            status={e.status}
            leagueType={leagueType}
          />
        )
      )}
      <h2>{t("Defenders")}</h2>
      {squad["def"].map(
        (
          e // Used to get the players for the defense
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            status={e.status}
            leagueType={leagueType}
          />
        )
      )}
      <h2>{t("Goalkeeper")}</h2>
      {squad["gk"].map(
        (
          e // Used to get the player for the goalkeeper
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            update={getSquad}
            status={e.status}
            leagueType={leagueType}
          />
        )
      )}
      <h2>{t("Bench")}</h2>
      <FormControlLabel
        control={
          <Switch
            id="showSelling"
            onChange={(e) => {
              setShowSelling(e.target.checked);
            }}
            checked={showSelling}
          />
        }
        label={t("Show Players that are being sold")}
      />
      {squad["bench"]
        .filter((e) => showSelling || e.status !== "sell")
        .map(
          (
            e // Used to get the players for the bench
          ) => (
            <Player
              uid={e.playeruid}
              key={e.playeruid}
              field={field}
              league={league}
              update={getSquad}
              status={e.status}
              leagueType={leagueType}
            />
          )
        )}
    </>
  );
}

// Gets the users session
export async function getServerSideProps(ctx) {
  const connection = await connect();
  const session = await getSession(ctx);
  const starredPercentage = await connection
    .query("SELECT starredPercentage FROM leagueSettings WHERE leagueID=?", [
      ctx.query.league,
    ])
    .then((res) => (res.length > 0 ? res[0].starredPercentage : 150));
  // Gets the league info
  const leagueInfo = await getLeagueInfo(
    ctx.query.league,
    session?.user?.id ? session?.user?.id : -1
  ).catch(() => {});
  connection.end();
  return await redirect(ctx, { starredPercentage, leagueInfo });
}
