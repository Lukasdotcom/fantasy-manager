import Head from "next/head";
import { useState } from "react";
import { getSession, SessionProvider, useSession } from "next-auth/react";
import { leagueList } from "./api/league";
import Link from "../components/Link";
import Menu from "../components/Menu";
import { push } from "@socialgouv/matomo-next";
import connect from "../Modules/database.mjs";
import { AlertTitle, Alert, TextField, Button } from "@mui/material";
// Used to create a new League
function MakeLeague({ getLeagueData, notify }) {
  const [leagueName, setLeagueName] = useState("");
  const [startingMoney, setStartingMoney] = useState(150);
  return (
    <>
      <h2>Create League</h2>
      <TextField
        label="Starting Money"
        type="number"
        id="startingMoney"
        variant="outlined"
        size="small"
        onChange={(e) => {
          setStartingMoney(parseFloat(e.target.value));
        }}
        value={startingMoney}
      />
      <br></br>
      <TextField
        label="League Name"
        id="name"
        variant="outlined"
        size="small"
        onChange={(e) => {
          setLeagueName(e.target.value);
        }}
        value={leagueName}
      />
      <br></br>
      <Button
        variant="contained"
        onClick={async () => {
          push(["trackEvent", "League", "Create", leagueName]);
          notify("Saving");
          // Used to create a league
          const response = await fetch("/api/league", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: leagueName,
              "Starting Money": startingMoney * 1000000,
            }),
          });
          notify(await response.text(), response.ok ? "success" : "error");
          getLeagueData();
        }}
      >
        Create League
      </Button>
    </>
  );
}
// Used to leave a league
function LeaveLeague({ leagueID, getLeagueData, notify }) {
  return (
    <Button
      style={{ margin: "5px" }}
      variant="outlined"
      color="error"
      id={leagueID}
      onClick={async (e) => {
        notify("Leaving");
        push(["trackEvent", "League", "Leave", leagueID]);
        const response = await fetch(`/api/league/${leagueID}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        notify(await response.text(), response.ok ? "success" : "error");
        getLeagueData();
      }}
      className="red-button"
    >
      Leave League
    </Button>
  );
}
// Used to list all the leagues you are part of and to add a league
function Leagues({ leagueData, notify }) {
  const { data: session } = useSession();
  const [legueList, setLeagueList] = useState(leagueData);
  if (session) {
    // Used to get a list of all the leagues
    const getLeagueData = async () => {
      let data = await fetch("/api/league");
      setLeagueList(await data.json());
    };
    return (
      <>
        <h1>Leagues</h1>
        {legueList.map((val) => (
          // Makes a link for every league
          <div key={val.leagueID}>
            <strong>{val.leagueName}</strong>
            <Link href={`/${val.leagueID}`}>
              <Button style={{ margin: "5px" }} variant="outlined">
                Open League
              </Button>
            </Link>
            <LeaveLeague
              leagueID={val.leagueID}
              getLeagueData={getLeagueData}
              notify={notify}
            />
          </div>
        ))}
        <MakeLeague getLeagueData={getLeagueData} notify={notify} />
      </>
    );
  } else {
    return <></>;
  }
}
export default function Home({ session, leagueData, versionData, notify }) {
  return (
    <>
      <Head>
        <title>Bundesliga Fantasy</title>
      </Head>
      <Menu session={session} />
      <h1>Bundesliga Fantasy Manager</h1>
      <SessionProvider session={session}>
        <Leagues leagueData={leagueData} notify={notify} />
      </SessionProvider>
      {versionData !== null && (
        <Alert severity="warning" className="notification">
          <AlertTitle>Out of Date</AlertTitle>
          <a href={versionData} rel="noreferrer" target="_blank">
            New Update Available for more info Click Here
          </a>
        </Alert>
      )}
    </>
  );
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  const versionData = await connection
    .query("SELECT value2 FROM data WHERE value1='updateProgram'")
    .then((result) => (result.length === 0 ? null : result[0].value2));
  connection.end();
  const session = getSession(ctx);
  if (await session) {
    return {
      props: {
        versionData: await versionData,
        leagueData: JSON.parse(
          JSON.stringify(await leagueList((await session).user.id))
        ),
      },
    };
  } else {
    return { props: { versionData: await versionData, leagueData: [] } };
  }
}
