import {
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import Head from "next/head";
import Link from "../components/Link";
import { useContext, useState } from "react";
import Menu from "../components/Menu";
import { GetStaticProps } from "next";
import { TranslateContext } from "../Modules/context";
import getLocales from "../locales/getLocales";
import connect from "#/Modules/database";
type historicalTimes = { [Key: string]: number[] };
interface props {
  historicalTimes: historicalTimes;
  leagues: string[];
  league_enabled: { [Key: string]: boolean };
}
type fileTypes = "json" | "csv";
export default function Home({
  historicalTimes,
  leagues,
  league_enabled,
}: props) {
  const [matchday, setMatchday] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [league, setLeague] = useState(leagues[0]);
  // Used to handle when the league selected changes
  const changeLeague = (e: SelectChangeEvent) => {
    setLeague(e.target.value);
    setMatchday(0);
  };
  // Generates the download link
  function downloadLink(type: fileTypes) {
    return `/api/download?type=${type}&league=${league}${
      matchday !== 0 ? `&time=${matchday}` : ""
    }${showHidden ? "&showHidden=true" : ""}`;
  }
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("Download Data")}</title>
      </Head>
      <Menu />
      <h1>{t("Download Data")}</h1>
      <p>
        {t("Here you can download the player data for personal use. ")}
        {t("This downloaded player data is only available in english. ")}
      </p>
      {leagues.length > 0 && (
        <>
          <InputLabel htmlFor="time">{t("Time")}</InputLabel>
          <Select
            id="time"
            value={matchday}
            onChange={(val) => setMatchday(val.target.value as number)}
          >
            {historicalTimes[league].map((e: number) => {
              const date = new Date(e * 1000);
              return (
                <MenuItem key={e} value={e}>
                  {t("{date}", { date })}
                </MenuItem>
              );
            })}
            <MenuItem value={0}>{t("Latest")}</MenuItem>
          </Select>
          <InputLabel htmlFor="league">{t("League")}</InputLabel>
          <Select value={league} onChange={changeLeague} id="league">
            {leagues.map((val) => (
              <MenuItem key={val} value={val}>
                {t(val)}
              </MenuItem>
            ))}
          </Select>
          <br />
          {!league_enabled[league] && (
            <p>{t("Note that this league is not updated anymore.")}</p>
          )}
          <FormControlLabel
            label={t("Download hidden players in addition to all other ones")}
            control={
              <Checkbox
                id="showHidden"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
            }
          />
          <br />
          <ButtonGroup>
            <Button>
              <Link disableNext={true} href={downloadLink("json")}>
                {t("Download as {file}", { file: "json" })}
              </Link>
            </Button>
            <Button>
              <Link disableNext={true} href={downloadLink("csv")}>
                {t("Download as {file}", { file: "csv" })}
              </Link>
            </Button>
          </ButtonGroup>
        </>
      )}
      {leagues.length === 0 && (
        <Link href="/error/no-league">{t("No league types exist. ")}</Link>
      )}
    </>
  );
}
export const getStaticProps: GetStaticProps = async (context) => {
  const connection = await connect();
  // Gets a list of all the times stored by each league
  const historicalTimes: historicalTimes = {};
  const leagueTypes: string[] = (
    await connection.query("SELECT DISTINCT league FROM players")
  ).map((e) => e.league);
  const league_enabled: { [Key: string]: boolean } = {};
  await Promise.all(
    leagueTypes.map(
      (league) =>
        new Promise<void>(async (res) => {
          await connection
            .query(
              "SELECT DISTINCT time FROM historicalPlayers WHERE league=?",
              [league],
            )
            .then((e) => {
              historicalTimes[league] = e.map((e: { time: number }) => e.time);
            });
          await connection
            .query("SELECT * FROM plugins WHERE name=? AND enabled=1", [league])
            .then((e) => {
              league_enabled[league] = e.length > 0;
            });
          res();
        }),
    ),
  );
  return {
    props: {
      historicalTimes,
      leagues: leagueTypes,
      league_enabled,
      t: await getLocales(context.locale),
    },
  };
};
