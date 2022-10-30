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
import { useState } from "react";
import Menu from "../components/Menu";
import connect, { leagues as leagueTypes } from "../Modules/database";
import { GetServerSideProps } from "next";
type historicalTimes = { [Key: string]: number[] };
interface props {
  historicalTimes: historicalTimes;
  leagues: string[];
}
type fileTypes = "json" | "csv";
export default function Home({ historicalTimes, leagues }: props) {
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
  return (
    <>
      <Head>
        <title>Download</title>
      </Head>
      <Menu />
      <h1>Download Data</h1>
      <p>Here you can download the player data for personal use.</p>
      <InputLabel htmlFor="time">Time</InputLabel>
      <Select
        id="time"
        value={matchday}
        onChange={(val) => setMatchday(val.target.value as number)}
      >
        {historicalTimes[league].map((e: number) => {
          let date = new Date(e * 1000);
          return (
            <MenuItem key={e} value={e}>
              {date.toDateString()}
            </MenuItem>
          );
        })}
        <MenuItem value={0}>Latest</MenuItem>
      </Select>
      <InputLabel htmlFor="league">Which league: </InputLabel>
      <Select value={league} onChange={changeLeague} id="league">
        {leagues.map((val) => (
          <MenuItem key={val} value={val}>
            {val}
          </MenuItem>
        ))}
      </Select>
      <br></br>
      <FormControlLabel
        label="Download hidden players in addition to all other ones"
        control={
          <Checkbox
            id="showHidden"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
        }
      />
      <br></br>
      <ButtonGroup>
        <Button>
          <Link disableNext={true} href={downloadLink("json")}>
            Download as JSON
          </Link>
        </Button>
        <Button>
          <Link disableNext={true} href={downloadLink("csv")}>
            Download as CSV
          </Link>
        </Button>
      </ButtonGroup>
    </>
  );
}
export const getServerSideProps: GetServerSideProps = async () => {
  const connection = await connect();
  // Gets a list of all the times stored by each league
  const historicalTimes: historicalTimes = {};
  await Promise.all(
    leagueTypes.map((league) =>
      connection
        .query("SELECT DISTINCT time FROM historicalPlayers WHERE league=?", [
          league,
        ])
        .then((e) => {
          historicalTimes[league] = e.map((e: { time: number }) => e.time);
        })
    )
  );
  return { props: { historicalTimes, leagues: leagueTypes } };
};
