import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { useEffect, useState } from "react";
import { UserChip } from "../../components/Username";
import { push } from "@socialgouv/matomo-next";
import { getSession } from "next-auth/react";
import connect from "../../Modules/database.mjs";
import Link from "../../components/Link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Pagination,
  PaginationItem,
  TextField,
  InputAdornment,
  Autocomplete,
  Box,
} from "@mui/material";

// Creates the admin panel
function AdminPanel({ league, notify, leagueName, setLeagueName, admin }) {
  const [startingMoney, setStartingMoney] = useState(150);
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState(6);
  const [duplicatePlayers, setDuplicatePlayers] = useState(1);
  const [starredPercentage, setStarredPercentage] = useState(150);
  function updateData(league) {
    fetch(`/api/league/${league}`).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        setStartingMoney(result.settings.startMoney / 1000000);
        setUsers(result.users);
        setTransfers(result.settings.transfers);
        setDuplicatePlayers(result.settings.duplicatePlayers);
        setStarredPercentage(result.settings.starredPercentage);
      } else {
        alert(await res.text());
      }
    });
  }
  useEffect(() => {
    updateData(league);
  }, [league]);
  if (admin) {
    return (
      <>
        <h1>Admin Panel</h1>
        <TextField
          id="leagueName"
          variant="outlined"
          size="small"
          label="League Name"
          onChange={(val) => {
            // Used to change the invite link
            setLeagueName(val.target.value);
          }}
          value={leagueName}
        />
        <br></br>
        <TextField
          id="startingMoney"
          variant="outlined"
          size="small"
          label="Starting Money"
          type="number"
          onChange={(val) => {
            // Used to change the invite link
            setStartingMoney(val.target.value);
          }}
          value={startingMoney}
        />
        <br />
        <TextField
          id="transfers"
          variant="outlined"
          size="small"
          label="Transfer Amount"
          type="number"
          onChange={(val) => {
            // Used to change the invite link
            setTransfers(val.target.value);
          }}
          value={transfers}
        />
        <br />
        <TextField
          id="duplicatePlayers"
          variant="outlined"
          size="small"
          helperText="Amount of Squads players can be in"
          type="number"
          onChange={(val) => {
            // Used to change the invite link
            setDuplicatePlayers(val.target.value);
          }}
          value={duplicatePlayers}
        />
        <br></br>
        <TextField
          id="starredPercentage"
          variant="outlined"
          size="small"
          helperText="Point boost for starred players"
          InputProps={{
            endadornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          type="number"
          onChange={(val) => {
            // Used to change the invite link
            setStarredPercentage(val.target.value);
          }}
          value={starredPercentage}
        />
        <br></br>
        <Autocomplete
          multiple
          id="admins"
          options={users}
          freeSolo
          value={users.filter((e) => e.admin == 1)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <UserChip
                key={option.user}
                userid={option.user}
                {...getTagProps({ index })}
              />
            ))
          }
          onChange={(e, value) => {
            let admins = value.map((e) => e.user);
            setUsers((e2) => {
              // Updates the value for all of the users
              e2.forEach((e3) => {
                e3.admin = admins.includes(parseInt(e3.user));
              });
              return [...e2];
            });
          }}
          renderOption={(props, option) => (
            <Box {...props}>
              <UserChip key={option.user} userid={option.user} />
            </Box>
          )}
          getOptionLabel={(option) => String(option.user)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Admins"
              placeholder="New Admin"
            />
          )}
        />
        <br></br>
        <Button
          onClick={() => {
            // Used to save the data
            notify("Saving");
            fetch(`/api/league/${league}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                users,
                settings: {
                  startingMoney: startingMoney * 1000000,
                  transfers,
                  duplicatePlayers,
                  starredPercentage,
                  leagueName,
                },
              }),
            }).then(async (res) => {
              notify(await res.text(), res.ok ? "success" : "error");
            });
          }}
          variant="contained"
        >
          Save Admin Settings
        </Button>
      </>
    );
  } else {
    return (
      <>
        <h1>Settings</h1>
        <p>Starting Money : {startingMoney}</p>
        <p>Transfer Limit : {transfers}</p>
        <p>Number of Squads a Player can be in : {duplicatePlayers}</p>
        <p>Starred Player Percantage : {starredPercentage}%</p>
      </>
    );
  }
}
// Used to show all the invites that exist and to delete an individual invite
function Invite({ link, league, host, remove, notify }) {
  return (
    <p>
      Link: {`${host}/api/invite/${link}`}
      <Button
        onClick={async () => {
          notify("Deleting");
          push(["trackEvent", "Delete Invite", league, link]);
          const response = await fetch("/api/invite", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leagueID: league,
              link: link,
            }),
          });
          notify(await response.text(), response.ok ? "success" : "error");
          remove();
        }}
        sx={{ margin: "5px" }}
        variant="outlined"
        color="error"
      >
        Delete
      </Button>
    </p>
  );
}
export default function Home({
  user,
  admin,
  league,
  standings,
  historicalPoints,
  inviteLinks,
  host,
  notify,
  leagueName,
}) {
  const [inputLeagueName, setInputLeagueName] = useState(leagueName);
  // Calculates the current matchday
  let currentMatchday = 0;
  if (Object.values(historicalPoints).length !== 0) {
    currentMatchday = Object.values(historicalPoints)[0].length;
  }
  const [matchday, setmatchday] = useState(currentMatchday + 1);
  const [invites, setInvites] = useState(inviteLinks);
  const [newInvite, setnewInvite] = useState("");
  // Orders the players in the correct order by points
  if (matchday <= currentMatchday) {
    standings = [];
    Object.keys(historicalPoints).forEach((e) => {
      standings.push({
        user: e,
        points: historicalPoints[String(e)][matchday - 1],
      });
    });
    standings.sort((a, b) => b.points - a.points);
  }
  return (
    <>
      <Head>
        <title>{`Standings for ` + inputLeagueName}</title>
      </Head>
      <Menu league={league} />
      <h1>Standings for {inputLeagueName}</h1>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>
                {matchday > currentMatchday
                  ? "Total Points"
                  : `Matchday ${matchday} Points`}
              </TableCell>
              <TableCell>Buttons to View Historical Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((val) => (
              <TableRow key={val.user}>
                <TableCell>
                  <UserChip userid={val.user} />
                </TableCell>
                <TableCell>
                  {matchday > currentMatchday
                    ? val.points
                    : historicalPoints[val.user][matchday - 1]}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/${league}/${val.user}/${
                      matchday > currentMatchday ? "" : matchday
                    }`}
                  >
                    <Button>Click to View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <p>Select the matchday here</p>
      <Pagination
        page={matchday}
        count={currentMatchday + 1}
        onChange={(e, v) => {
          setmatchday(v);
        }}
        renderItem={(item) => {
          if (item.page > currentMatchday) item.page = "All";
          return <PaginationItem {...item} />;
        }}
      >
        <PaginationItem type="last">adsadsdasdas</PaginationItem>
      </Pagination>
      <h1>Invite Links</h1>
      {invites.map((val) => (
        <Invite
          host={host}
          key={val}
          link={val}
          league={league}
          notify={notify}
          remove={() => {
            setInvites(invites.filter((e) => e != val));
          }}
        />
      ))}
      {/* Used to create a new invite link */}
      <TextField
        id="invite"
        variant="outlined"
        size="small"
        label="Invite Link"
        onChange={(val) => {
          // Used to change the invite link
          setnewInvite(val.target.value);
        }}
        value={newInvite}
      />
      <Button
        onClick={async () => {
          let link = newInvite;
          notify("Creating new invite");
          // Makes sure to generate a random leagueID if none is given
          if (link === "") {
            link = String(Math.random()).slice(2);
          }
          const response = await fetch("/api/invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leagueID: league,
              link: link,
            }),
          });
          notify(await response.text(), response.ok ? "success" : "error");
          if (response.ok) setInvites([...invites, link]);
        }}
      >
        Add Invite
      </Button>
      <AdminPanel
        leagueName={inputLeagueName}
        setLeagueName={setInputLeagueName}
        user={user}
        league={league}
        notify={notify}
        admin={admin}
      />
    </>
  );
}

// Gets the users session
export async function getServerSideProps(ctx) {
  // Gets the user id
  const session = await getSession(ctx);
  const user = session ? session.user.id : -1;
  // Gets the leaderboard for the league
  const standings = new Promise(async (resolve) => {
    const connection = await connect();
    resolve(
      await connection.query(
        "SELECT user, points FROM leagueUsers WHERE leagueId=?",
        [ctx.params.league]
      )
    );
    connection.end();
  }).then((val) =>
    JSON.parse(JSON.stringify(val.sort((a, b) => b.points - a.points)))
  );
  // Gets the historical amount of points for every matchday in the league
  const historicalPoints = new Promise(async (resolve) => {
    const connection = await connect();
    const results = await connection.query(
      "SELECT user, points, matchday FROM points WHERE leagueId=? ORDER BY matchday ASC",
      [ctx.params.league]
    );
    connection.end();
    // Reformats the result into a dictionary that has an entry for each user and each entry for that user is an array of all the points the user has earned in chronological order.
    if (results.length > 0) {
      let points = {};
      results.forEach((element) => {
        if (points[element.user]) {
          points[element.user].push(element.points);
        } else {
          points[element.user] = [element.points];
        }
      });
      resolve(points);
    } else {
      resolve({});
    }
  }).then((val) => JSON.parse(JSON.stringify(val)));
  const inviteLinks = new Promise(async (resolve) => {
    // Gets an array of invite links for this league
    const connection = await connect();
    const results = await connection.query(
      "SELECT inviteID FROM invite WHERE leagueId=?",
      [ctx.params.league]
    );
    connection.end();
    // Turns the result into a list of valid invite links
    let inviteLinks = [];
    results.forEach((val) => {
      inviteLinks.push(val.inviteID);
    });
    resolve(inviteLinks);
  }).then((val) => JSON.parse(JSON.stringify(val)));
  // Checks if the user is an admin
  const admin = new Promise(async (res) => {
    const connection = await connect();
    const result = await connection.query(
      "SELECT admin FROM leagueUsers WHERE admin=1 AND leagueID=? AND user=?",
      [ctx.params.league, user]
    );
    res(result.length > 0);
  });
  return await redirect(ctx, {
    admin: await admin,
    standings: await standings,
    historicalPoints: await historicalPoints,
    inviteLinks: await inviteLinks,
    host: ctx.req.headers.host,
  });
}
