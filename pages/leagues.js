import Head from "next/head";
import { useEffect, useState } from "react";
import { getSession, SessionProvider, useSession } from "next-auth/react";
import { leagueList } from "./api/league";
import Link from "../components/Link";
import Menu from "../components/Menu";
import { push } from "@socialgouv/matomo-next";
import {
  TextField,
  Button,
  IconButton,
  Icon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
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
function LeaveLeague({ leagueID, leagueName, getLeagueData, notify }) {
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  // Handles the opening of the dialog
  function handleOpen() {
    setConfirmation("");
    setOpen(true);
  }
  // Handles the closing of the dialog
  function handleClose() {
    setOpen(false);
  }
  // Handles the closing of the dialog if it was confirmed
  async function deleteLeague() {
    setOpen(false);
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
  }
  return (
    <>
      <Button
        style={{ margin: "5px" }}
        variant="outlined"
        color="error"
        id={leagueID}
        onClick={handleOpen}
      >
        Leave League
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <Icon color="warning">warning</Icon>
          {" Are you sure you want to leave?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Leaving a league <b>will permanently delete</b> all the data that
            you generated in the league. Please confirm that you want to do this
            by typing the name of the league in the box below. The name is:
            <b>{leagueName}</b>.
          </DialogContentText>
          <TextField
            error={leagueName !== confirmation}
            label="Enter league name here"
            variant="standard"
            margin="dense"
            fullWidth
            size="small"
            placeholder={leagueName}
            onChange={(e) => {
              setConfirmation(e.target.value);
            }}
            value={confirmation}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            variant="outlined"
            color="error"
            autoFocus
          >
            Cancel
          </Button>
          <Button
            onClick={deleteLeague}
            variant="contained"
            color="error"
            disabled={leagueName !== confirmation}
          >
            Leave League
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
// Used to list all the leagues you are part of and to add a league
function Leagues({ leagueData, notify }) {
  const { data: session } = useSession();
  const [leagueList, setLeagueList] = useState(leagueData);
  const [favoriteLeague, setFavoriteLeague] = useState(undefined);
  // Gets the favorite league
  useEffect(() => {
    // Only updates this when favorite league is undefined and in a session
    if (favoriteLeague || !session) {
      return;
    }
    const newFavoriteLeague = leagueList.filter(
      (e) => e.leagueID === session.user.favoriteLeague
    );
    setFavoriteLeague(
      newFavoriteLeague.length > 0
        ? JSON.parse(JSON.stringify(newFavoriteLeague[0]))
        : undefined
    );
  }, [session, leagueList, favoriteLeague]);
  // Used to update the favorite
  async function updateFavorite(val) {
    let leagueID = "none";
    if (val) {
      leagueID = val.leagueID;
    }
    notify("Updaing Favorite");
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        favorite: leagueID,
      }),
    });
    notify(await response.text(), response.ok ? "success" : "error");
    setFavoriteLeague(val);
  }
  if (session) {
    // Used to get a list of all the leagues
    const getLeagueData = async () => {
      let data = await fetch("/api/league");
      setLeagueList(await data.json());
    };
    return (
      <>
        <h1>Leagues</h1>
        <p>
          Your favorited league will be available in the menu when you are not
          in a league. Note that the menu only updates on a page navigation or
          reload.
        </p>
        {favoriteLeague && (
          <p>Your favorite league is: {favoriteLeague.leagueName}.</p>
        )}
        {!favoriteLeague && <p>You have no favorite league.</p>}
        {leagueList.map((val) => (
          // Makes a link for every league
          <div key={val.leagueID}>
            <strong>{val.leagueName}</strong>
            <Link href={`/${val.leagueID}`}>
              <Button style={{ margin: "5px" }} variant="outlined">
                Open League
              </Button>
            </Link>
            <LeaveLeague
              leagueName={val.leagueName}
              leagueID={val.leagueID}
              getLeagueData={getLeagueData}
              notify={notify}
            />
            <IconButton
              style={{ margin: "5px" }}
              color="secondary"
              onClick={() => updateFavorite(val)}
            >
              <Icon>
                {favoriteLeague && favoriteLeague.leagueID === val.leagueID
                  ? "star"
                  : "star_outline"}
              </Icon>
            </IconButton>
          </div>
        ))}
        <Button
          color="error"
          variant="outlined"
          onClick={() => updateFavorite(undefined)}
        >
          Clear Favorite League<Icon>delete</Icon>
        </Button>
        <MakeLeague getLeagueData={getLeagueData} notify={notify} />
      </>
    );
  } else {
    return <p>You shouldn&apos;t be here. Log in please.</p>;
  }
}
export default function Home({ leagueData, notify }) {
  return (
    <>
      <Head>
        <title>Leagues</title>
      </Head>
      <Menu />
      <h1>Bundesliga Fantasy Manager</h1>
      <SessionProvider>
        <Leagues leagueData={leagueData} notify={notify} />
      </SessionProvider>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const session = getSession(ctx);
  if (await session) {
    return {
      props: {
        leagueData: JSON.parse(
          JSON.stringify(await leagueList((await session).user.id))
        ),
      },
    };
  } else {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          ctx.resolvedUrl
        )}`,
        permanent: false,
      },
    };
  }
}
