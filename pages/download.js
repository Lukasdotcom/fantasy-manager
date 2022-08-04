import { push } from "@socialgouv/matomo-next";
import Head from "next/head";
import { useState } from "react";
import Menu from "../components/Menu";
import connect from "../Modules/database.mjs";
export default function Home({ session, historicalTimes }) {
  const [matchday, setMatchday] = useState("");
  // Tracks the kind of download
  function download(type) {
    if (matchday !== "") push(["trackEvent", "Download", "Time", matchday]);
    push(["trackEvent", "Download", "Type", type]);
  }
  // Generates the download link
  function downloadLink(type) {
    return `/api/download?type=${type}${
      matchday !== "" ? `&time=${matchday}` : ""
    }`;
  }
  return (
    <>
      <Head>
        <title>Download</title>
      </Head>
      <Menu session={session} />
      <h1>Download Data</h1>
      <p>Here you can download the player data for personal use.</p>
      <label htmlFor="time">Select historical time here: </label>
      <select
        onChange={(val) => setMatchday(val.target.value)}
        value={matchday}
        id="time"
      >
        {historicalTimes.map((e) => {
          let date = new Date(e * 1000);
          return (
            <option key={e} value={e}>
              {date.toDateString()}
            </option>
          );
        })}
        <option value="">Latest</option>
      </select>
      <br></br>
      <button
        onClick={() => {
          download("json");
        }}
      >
        <a href={downloadLink("json")}>Downlad as json</a>
      </button>
      <button
        onClick={() => {
          download("csv");
        }}
      >
        <a href={downloadLink("csv")}>Downlad as csv</a>
      </button>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  // Gets a list of all the times
  const historicalTimes = (
    await connection.query("SELECT DISTINCT time FROM historicalPlayers")
  ).map((e) => e.time);
  return { props: { historicalTimes } };
}
