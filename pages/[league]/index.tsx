import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { SyntheticEvent, useContext, useEffect, useState } from "react";
import { stringToColor, UserChip } from "../../components/Username";
import { push } from "@socialgouv/matomo-next";
import { getSession } from "next-auth/react";
import connect, { invite } from "../../Modules/database";
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
  BoxTypeMap,
  Slider,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { NotifyContext } from "../../Modules/context";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Box } from "@mui/system";
interface AdminPanelProps {
  league: number;
  leagueName: string;
  setLeagueName: (name: string) => void;
  admin: boolean;
}
// Creates the admin panel
function AdminPanel({
  league,
  leagueName,
  setLeagueName,
  admin,
}: AdminPanelProps) {
  const notify = useContext(NotifyContext);
  const [startingMoney, setStartingMoney] = useState(150);
  interface userData {
    user: number;
    admin: boolean;
  }
  const [users, setUsers] = useState<userData[]>([]);
  const [transfers, setTransfers] = useState(6);
  const [duplicatePlayers, setDuplicatePlayers] = useState(1);
  const [starredPercentage, setStarredPercentage] = useState(150.0);
  function updateData(league: number) {
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
            setStartingMoney(parseInt(val.target.value));
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
            // Used to change the transfer limit
            setTransfers(parseInt(val.target.value));
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
            // Used to change the amount of duplicate players
            setDuplicatePlayers(parseInt(val.target.value));
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
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          type="number"
          onChange={(val) => {
            // Used to change the invite link
            setStarredPercentage(parseFloat(val.target.value));
          }}
          value={starredPercentage}
        />
        <br></br>
        <Autocomplete
          sx={{ width: "99%" }}
          multiple
          id="admins"
          options={users}
          freeSolo
          value={users.filter((e) => e.admin)}
          renderTags={(value, getTagProps) =>
            value.map((option: userData, index) => (
              <UserChip
                userid={option.user}
                {...getTagProps({ index })}
                key={option.user}
              />
            ))
          }
          onChange={(
            e: SyntheticEvent<Element, Event>,
            value: (string | userData)[]
          ): void => {
            let admins = value.map((e) => (typeof e === "string" ? e : e.user));
            setUsers((e2) => {
              // Updates the value for all of the users
              e2.forEach((e3) => {
                e3.admin = admins.includes(e3.user);
              });
              return [...e2];
            });
          }}
          renderOption={(props, option) => {
            const newprops = props as BoxTypeMap;
            return (
              <Box {...newprops} key={option.user}>
                <UserChip userid={option.user} />
              </Box>
            );
          }}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : String(option.user)
          }
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
interface InviteProps {
  link: string;
  league: number;
  host: string | undefined;
  remove: () => void;
}
// Used to show all the invites that exist and to delete an individual invite
function Invite({ link, league, host, remove }: InviteProps) {
  const notify = useContext(NotifyContext);
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
// Used to generate the graph of the historical points
function Graph({ historicalPoints }: { historicalPoints: historialData }) {
  const [usernames, setUsernames] = useState(Object.keys(historicalPoints));
  const [dataRange, setDataRange] = useState<number[]>([
    1,
    Object.values(historicalPoints)[0].length,
  ]);
  useEffect(() => {
    Object.keys(historicalPoints).forEach((e, index) => {
      fetch(`/api/user/${e}`).then(async (val) => {
        const newUsername = await val.json();
        setUsernames((val) => {
          val[index] = newUsername;
          // Makes sure that the component updates after the state is changed
          return JSON.parse(JSON.stringify(val));
        });
      });
    });
  }, [historicalPoints]);
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
  const options: any = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Points over Time",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Matchday",
        },
      },
      y: {
        title: {
          display: true,
          text: "Points",
        },
      },
    },
  };
  // Adds a label for every matchday
  const labels = Array(dataRange[1] - dataRange[0] + 1)
    .fill(0)
    .map((e, index) => index + dataRange[0]);
  const datasets: any[] = [];
  // Adds every dataset
  Object.keys(historicalPoints).forEach((e, index) => {
    let counter = 0;
    datasets.push({
      label: usernames[index],
      data: historicalPoints[e]
        // Filters out the data that is outside of the range specified
        .slice(dataRange[0] - 1, dataRange[1] + 1)
        .map((e) => {
          counter += e;
          return counter;
        }),
      borderColor: stringToColor(parseInt(e)),
    });
  });
  const data = {
    labels,
    datasets,
  };
  return (
    <div
      style={{
        height: "min(max(50vh, 50vw), 50vh)",
        width: "95%",
        margin: "2%",
      }}
    >
      <Line options={options} data={data} />
      <Slider
        getAriaLabel={() => "Standings Range"}
        value={dataRange}
        onChange={(e, value) => {
          typeof value === "number" ? "" : setDataRange(value);
        }}
        valueLabelDisplay="auto"
        max={Object.values(historicalPoints)[0].length}
        min={1}
      />
    </div>
  );
}
interface Props {
  admin: boolean;
  standings: standingsData[];
  historicalPoints: historialData;
  inviteLinks: string[];
  host: string | undefined;
  leagueName: string;
  league: number;
}
export default function Home({
  admin,
  league,
  standings,
  historicalPoints,
  inviteLinks,
  host,
  leagueName,
}: Props) {
  const notify = useContext(NotifyContext);
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
  let newStandings: { user: number; points: number }[] = [];
  if (matchday <= currentMatchday) {
    Object.keys(historicalPoints).forEach((e: string) => {
      newStandings.push({
        user: parseInt(e),
        points: historicalPoints[e][matchday - 1],
      });
    });
    newStandings.sort((a, b) => b.points - a.points);
  } else {
    newStandings = standings;
  }
  return (
    <>
      <Head>
        <title>{`Standings for ` + inputLeagueName}</title>
      </Head>
      <Menu league={league} />
      <h1>Standings for {inputLeagueName}</h1>
      <TableContainer sx={{ width: "95%" }}>
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
            {newStandings.map((val) => (
              <TableRow key={val.user + "m" + matchday}>
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
          const page =
            item.page && item.page > currentMatchday ? "All" : item.page;
          return <PaginationItem {...item} page={page} />;
        }}
      ></Pagination>
      {Object.values(historicalPoints).length > 0 && (
        <Graph historicalPoints={historicalPoints} />
      )}
      <h1>Invite Links</h1>
      {invites.map((val) => (
        <Invite
          host={host}
          key={val}
          link={val}
          league={league}
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
        league={league}
        admin={admin}
      />
    </>
  );
}
interface historialData {
  [Key: string]: number[];
}
interface standingsData {
  user: number;
  points: number;
}
// Gets the users session
export const getServerSideProps: GetServerSideProps = async (
  ctx: GetServerSidePropsContext
) => {
  // Gets the user id
  const session = await getSession(ctx);
  const user = session ? session.user.id : -1;
  // Gets the leaderboard for the league
  const standings = new Promise<standingsData[]>(async (resolve) => {
    const connection = await connect();
    resolve(
      await connection.query(
        "SELECT user, points FROM leagueUsers WHERE leagueId=?",
        [ctx.params?.league]
      )
    );
    connection.end();
  }).then((val: standingsData[]) => val.sort((a, b) => b.points - a.points));
  // Gets the historical amount of points for every matchday in the league
  const historicalPoints = new Promise<historialData>(async (resolve) => {
    const connection = await connect();
    interface historialPlayerData {
      user: number;
      points: number;
      matchday: number;
    }
    const results: historialPlayerData[] = await connection.query(
      "SELECT user, points, matchday FROM points WHERE leagueId=? ORDER BY matchday ASC",
      [ctx.params?.league]
    );
    connection.end();
    // Reformats the result into a dictionary that has an entry for each user and each entry for that user is an array of all the points the user has earned in chronological order.
    if (results.length > 0) {
      let points: historialData = {};
      results.forEach((element: historialPlayerData) => {
        if (points[element.user]) {
          points[String(element.user)].push(element.points);
        } else {
          points[String(element.user)] = [element.points];
        }
      });
      resolve(points);
    } else {
      resolve({});
    }
  });
  const inviteLinks = new Promise<string[]>(async (resolve) => {
    // Gets an array of invite links for this league
    const connection = await connect();
    const results: invite[] = await connection.query(
      "SELECT * FROM invite WHERE leagueId=?",
      [ctx.params?.league]
    );
    connection.end();
    // Turns the result into a list of valid invite links
    let inviteLinks: string[] = [];
    results.forEach((val) => {
      inviteLinks.push(val.inviteID);
    });
    resolve(inviteLinks);
  }).then((val) => JSON.parse(JSON.stringify(val)));
  // Checks if the user is an admin
  const admin = new Promise<boolean>(async (res) => {
    const connection = await connect();
    const result = await connection.query(
      "SELECT admin FROM leagueUsers WHERE admin=1 AND leagueID=? AND user=?",
      [ctx.params?.league, user]
    );
    res(result.length > 0);
  });
  return redirect(ctx, {
    admin: await admin,
    standings: await standings,
    historicalPoints: await historicalPoints,
    inviteLinks: await inviteLinks,
    host: ctx.req.headers.host,
  });
};
