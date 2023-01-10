import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { SyntheticEvent, useContext, useEffect, useState } from "react";
import { stringToColor, UserChip } from "../../components/Username";
import { push } from "@socialgouv/matomo-next";
import { getSession } from "next-auth/react";
import connect, {
  announcements,
  anouncementColor,
  invite,
  leagueSettings,
} from "../../Modules/database";
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
  Checkbox,
  FormControlLabel,
  Alert,
  AlertTitle,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Icon,
  FormLabel,
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
import {
  NotifyContext,
  TranslateContext,
  UserContext,
} from "../../Modules/context";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Box } from "@mui/system";
import Router from "next/router";
interface AdminPanelProps {
  league: number;
  leagueName: string;
  setLeagueName: (name: string) => void;
  admin: boolean;
  leagueType: string;
  archived: boolean;
}
// Creates the admin panel
function AdminPanel({
  league,
  leagueName,
  setLeagueName,
  admin,
  leagueType,
  archived,
}: AdminPanelProps) {
  const notify = useContext(NotifyContext);
  const [startingMoney, setStartingMoney] = useState(150);
  interface userData {
    user: number;
    admin: boolean;
  }
  const t = useContext(TranslateContext);
  const [users, setUsers] = useState<userData[]>([]);
  const [transfers, setTransfers] = useState(6);
  const [duplicatePlayers, setDuplicatePlayers] = useState(1);
  const [starredPercentage, setStarredPercentage] = useState(150.0);
  const [archive, setArchive] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [matchdayTransfers, setMatchdayTransfers] = useState(false);
  function updateData(league: number) {
    fetch(`/api/league/${league}`).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        setStartingMoney(result.settings.startMoney / 1000000);
        setUsers(result.users);
        setTransfers(result.settings.transfers);
        setDuplicatePlayers(result.settings.duplicatePlayers);
        setStarredPercentage(result.settings.starredPercentage);
        setMatchdayTransfers(Boolean(result.settings.matchdayTransfers));
      } else {
        alert(await res.text());
      }
    });
  }
  useEffect(() => {
    updateData(league);
  }, [league]);
  if (admin && !archived) {
    return (
      <>
        <h1>{t("Admin Panel")}</h1>
        <p>
          {t("League Type Used: {leagueType}", { leagueType: t(leagueType) })}
        </p>
        <TextField
          id="leagueName"
          variant="outlined"
          size="small"
          label={t("League name")}
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
          label={t("Starting Money")}
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
          label={t("Transfer Limit")}
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
          helperText={t("Amount of squads a player can be in")}
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
          helperText={t("Point boost for starred players")}
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
              label={t("Admins")}
              placeholder={t("New admin")}
            />
          )}
        />
        <FormControlLabel
          label={t("Allow picking transfers during matchday. ")}
          control={
            <Checkbox
              checked={matchdayTransfers}
              onChange={() => {
                setMatchdayTransfers((e) => !e);
              }}
            />
          }
        />
        <br />
        <FormControlLabel
          label={t("Check this to archive the league when you press save. ")}
          control={
            <Checkbox
              checked={archive}
              onChange={() => {
                setArchive((e) => !e);
              }}
            />
          }
        />
        <br />
        {archive && (
          <TextField
            id="confirmation"
            error={leagueName !== confirmation}
            helperText={t("Enter league name here to confirm archive. ")}
            variant="outlined"
            margin="dense"
            size="small"
            placeholder={leagueName}
            onChange={(e) => {
              setConfirmation(e.target.value);
            }}
            value={confirmation}
          />
        )}
        <br></br>
        <Button
          onClick={() => {
            if (archive && confirmation !== leagueName) {
              notify(t("Confirmation text is wrong"), "error");
              return;
            }
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
                  archive,
                  matchdayTransfers,
                },
              }),
            }).then(async (res) => {
              notify(t(await res.text()), res.ok ? "success" : "error");
              if (archive) Router.push("/leagues");
            });
          }}
          variant="contained"
        >
          {t("Save admin settings")}
        </Button>
      </>
    );
  } else {
    return (
      <>
        <h1>{t("Settings")}</h1>
        <p>
          {t("League Type Used: {leagueType}", { leagueType: t(leagueType) })}
        </p>
        <p>{t("Starting money : {amount} M", { amount: startingMoney })}</p>
        <p>{t("Transfer limit : {amount}", { amount: transfers })}</p>
        <p>
          {t("Amount of squads a player can be in : {duplicatePlayers}", {
            duplicatePlayers,
          })}
        </p>
        <p>
          {t("Point boost for starred players : {starBoost}%", {
            starBoost: starredPercentage,
          })}
        </p>
        <p>
          {t("Transfers on matchdays are {allowed}", {
            allowed: matchdayTransfers ? t("Allowed") : t("Forbidden"),
          })}
        </p>
        <p>{t("This league is " + (archived ? "archived" : "not archived"))}</p>
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
  const t = useContext(TranslateContext);
  return (
    <p>
      {t("Link: {link}", { link: `${host}/api/invite/${link}` })}
      <Button
        onClick={async () => {
          notify(t("Deleting"));
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
          notify(t(await response.text()), response.ok ? "success" : "error");
          remove();
        }}
        sx={{ margin: "5px" }}
        variant="outlined"
        color="error"
      >
        {t("Delete")}
      </Button>
    </p>
  );
}
// Used to generate the graph of the historical points
function Graph({ historicalPoints }: { historicalPoints: historialData }) {
  const getUser = useContext(UserContext);
  const t = useContext(TranslateContext);
  const [usernames, setUsernames] = useState(Object.keys(historicalPoints));
  const [dataRange, setDataRange] = useState<number[]>([
    1,
    Object.values(historicalPoints)[0].length,
  ]);
  useEffect(() => {
    Object.keys(historicalPoints).forEach((e, index) => {
      getUser(parseInt(e)).then(async (newUsername) => {
        setUsernames((val) => {
          val[index] = newUsername;
          // Makes sure that the component updates after the state is changed
          return JSON.parse(JSON.stringify(val));
        });
      });
    });
  }, [historicalPoints, getUser]);
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
        text: t("Points over Time"),
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t("Matchday"),
        },
      },
      y: {
        title: {
          display: true,
          text: t("Points"),
        },
      },
    },
  };
  // Adds a label for every matchday
  const labels = Array(dataRange[1] - dataRange[0] + 1)
    .fill(0)
    .map((_, index) => index + dataRange[0]);
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
        onChange={(_, value) => {
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
  OGannouncement: announcements[];
  admin: boolean;
  standings: standingsData[];
  historicalPoints: historialData;
  inviteLinks: string[];
  host: string | undefined;
  leagueName: string;
  league: number;
  leagueType: string;
  archived: boolean;
  transfer: boolean;
}
export default function Home({
  OGannouncement,
  admin,
  league,
  standings,
  historicalPoints,
  inviteLinks,
  host,
  leagueName,
  leagueType,
  archived,
  transfer,
}: Props) {
  const t = useContext(TranslateContext);
  const notify = useContext(NotifyContext);
  const [inputLeagueName, setInputLeagueName] = useState(leagueName);
  // Calculates the current matchday
  let currentMatchday = 0;
  if (Object.values(historicalPoints).length !== 0) {
    currentMatchday = Object.values(historicalPoints)[0].length;
  }
  // Used to generate a random invite link
  const randomLink = (): string => {
    return (
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2)
    );
  };
  const [announcementPriority, setAnouncementPriority] =
    useState<anouncementColor>("info");
  const [announcementDescription, setAnouncementDescription] = useState("");
  const [announcementTitle, setAnouncementTitle] = useState("");
  const [announcements, setAnouncements] = useState(OGannouncement);
  const [matchday, setmatchday] = useState(currentMatchday + 1);
  const [invites, setInvites] = useState(inviteLinks);
  const [newInvite, setnewInvite] = useState(randomLink);
  // Used to delete an anouncement
  const deleteAnouncement = (idx: number) => {
    notify(t("Deleting anouncement"));
    fetch(`/api/league/${league}/announcement`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueID: league,
        title: announcements[idx].title,
        description: announcements[idx].description,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      if (response.ok) {
        setAnouncements((e) => {
          e = e.filter((e, index) => index !== idx);
          return e;
        });
      }
    });
  };
  // Used to add an anouncement
  const addAnouncement = () => {
    notify(t("Adding anouncement"));
    fetch(`/api/league/${league}/announcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priority: announcementPriority,
        title: announcementTitle,
        description: announcementDescription,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      if (response.ok) {
        setAnouncements((e) => {
          e.push({
            leagueID: league,
            priority: announcementPriority,
            title: announcementTitle,
            description: announcementDescription,
          });
          return e;
        });
      }
    });
  };
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
        <title>
          {t("Standings for {leagueName}", { leagueName: inputLeagueName })}
        </title>
      </Head>
      <Menu league={league} />
      <Alert severity="info">
        <AlertTitle>{t("Help")}</AlertTitle>
        <Button variant="outlined">
          <Link href={`/${league}/help`} underline="none">
            {t("Click Here For a Tutorial")}
          </Link>
        </Button>
      </Alert>
      <h1>
        {t("Standings for {leagueName}", { leagueName: inputLeagueName })}
      </h1>
      <TableContainer sx={{ width: "95%" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("Username")}</TableCell>
              <TableCell>
                {matchday > currentMatchday
                  ? t("Total Points")
                  : t("Matchday {matchday} Points", { matchday })}
              </TableCell>
              <TableCell></TableCell>
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
                    <Button>{t("Click to view squad")}</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <FormLabel id="matchdayLabel">{t("Select matchday")}</FormLabel>
      <Pagination
        id="matchdayLabel"
        page={matchday}
        count={currentMatchday + 1}
        onChange={(e, v) => {
          setmatchday(v);
        }}
        renderItem={(item) => {
          const page =
            item.page && item.page > currentMatchday ? t("All") : item.page;
          return <PaginationItem {...item} page={page} />;
        }}
      ></Pagination>
      {Object.values(historicalPoints).length > 0 && (
        <Graph historicalPoints={historicalPoints} />
      )}
      <h1>{t("Announcements")}</h1>
      {announcements.map((e: announcements, idx) => (
        <Alert key={idx} severity={e.priority} sx={{ position: "relative" }}>
          <AlertTitle>{e.title}</AlertTitle>
          {admin && (
            <IconButton
              id="close"
              aria-label="close"
              onClick={() => {
                deleteAnouncement(idx);
              }}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Icon>close</Icon>
            </IconButton>
          )}
          {e.description}
        </Alert>
      ))}
      {admin && (
        <>
          <TextField
            id="announcementTitle"
            variant="outlined"
            size="small"
            label={t("Title")}
            onChange={(val) => {
              // Used to change the title
              setAnouncementTitle(val.target.value);
            }}
            value={announcementTitle}
          />
          <br />
          <TextField
            id="announcementDescription"
            variant="outlined"
            label={t("Content")}
            multiline
            minRows={2}
            onChange={(val) => {
              // Used to change the description
              setAnouncementDescription(val.target.value);
            }}
            value={announcementDescription}
          />
          <br />
          <InputLabel htmlFor="priority">
            {t("Announcement Priority: ")}
          </InputLabel>
          <Select
            id="priority"
            value={announcementPriority}
            onChange={(val) =>
              setAnouncementPriority(val.target.value as anouncementColor)
            }
          >
            {["info", "success", "warning", "error"].map((e: string) => (
              <MenuItem key={e} value={e}>
                {t(e)}
              </MenuItem>
            ))}
          </Select>
          <br />
          <Button variant="contained" color="success" onClick={addAnouncement}>
            {t("Add announcement")}
          </Button>
        </>
      )}
      <h1>{t("Invite Links")}</h1>
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
        label={t("Invite link")}
        onChange={(val) => {
          // Used to change the invite link
          setnewInvite(val.target.value);
        }}
        value={newInvite}
      />
      <Button
        onClick={async () => {
          let link = newInvite;
          notify(t("Creating new invite link"));
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
          notify(t(await response.text()), response.ok ? "success" : "error");
          if (response.ok) {
            setInvites([...invites, link]);
            // Makes sure to generate a new random link id
            setnewInvite(randomLink());
          }
        }}
      >
        {t("Add invite")}
      </Button>
      <AdminPanel
        leagueName={inputLeagueName}
        setLeagueName={setInputLeagueName}
        league={league}
        admin={admin}
        leagueType={leagueType}
        archived={archived}
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
  const announcements = new Promise<announcements[]>(async (res) => {
    const connection = await connect();
    res(
      await connection.query("SELECT * FROM announcements WHERE leagueID=?", [
        ctx.params?.league,
      ])
    );
  });
  const transfer = new Promise<boolean>(async (res) => {
    const connection = await connect();
    const result = await connection.query(
      "SELECT value2 FROM data WHERE value1=?",
      [
        "transferOpen" +
          (await connection
            .query("SELECT league FROM leagueSettings WHERE leagueID=?", [
              ctx.params?.league,
            ])
            .then((e: leagueSettings[]) => (e.length > 0 ? e[0].league : ""))),
      ]
    );
    res(result.length > 0 ? result[0].value2 == "true" : true);
  });
  return redirect(ctx, {
    OGannouncement: await announcements,
    admin: await admin,
    standings: await standings,
    historicalPoints: await historicalPoints,
    inviteLinks: await inviteLinks,
    host: ctx.req.headers.host,
    transfer: await transfer,
  });
};
