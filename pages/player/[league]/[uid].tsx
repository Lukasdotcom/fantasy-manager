import Menu from "../../../components/Menu";
import Link from "../../../components/Link";
import Dialog from "../../../components/Dialog";
import { GetServerSideProps } from "next";
import Head from "next/head.js";
import connect, {
  forecast,
  historicalPlayers,
  players,
} from "../../../Modules/database";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import {
  Button,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
} from "@mui/material";
import { result as apiPlayerResult } from "../../api/player/[leagueType]/[uid]";
import { TranslateContext } from "../../../Modules/context";
import getLocales from "../../../locales/getLocales";
import { downloadPicture } from "#/scripts/pictures";
interface pictures {
  id: number;
  height?: number;
  width?: number;
}
interface extendedPlayers extends players {
  game: {
    opponent: string;
    gameStart: number;
  };
}
interface props {
  uid: string;
  player: extendedPlayers;
  times: number[];
  league: string;
  otherLeagues: { league: string; uid: string }[];
  pictures: pictures[];
}
interface Column {
  id:
    | "time"
    | "value"
    | "last_match"
    | "average_points"
    | "total_points"
    | "opponent"
    | "club"
    | "position";
  label: string;
  format: (value: string | number) => string;
}
interface Data {
  time: number;
  value: number;
  last_match: number;
  average_points: number;
  total_points: number;
  club: string;
  opponent: string;
  position: string;
  exists: boolean;
  forecast: forecast;
  loading: false;
}
export default function Home({
  player,
  times,
  uid,
  league,
  otherLeagues,
  pictures,
}: props) {
  const t = useContext(TranslateContext);
  // An array of all the columns
  const columns: Column[] = [
    {
      id: "time",
      label: "Time",
      format: (value: string | number) => {
        const date = new Date(parseInt(String(value)) * 1000);
        return value === 0 ? t("Now") : t("{date}", { date });
      },
    },
    {
      id: "value",
      label: "Value",
      format: (value: string | number) =>
        t("{amount} M", { amount: parseInt(String(value)) / 1000000 }),
    },
    {
      id: "last_match",
      label: "Last Match Points",
      format: (value: string | number) => t("{value}", { value }),
    },
    {
      id: "average_points",
      label: "Average Points",
      format: (value: string | number) => t("{value}", { value }),
    },
    {
      id: "total_points",
      label: "Total Points",
      format: (value: string | number) => t("{value}", { value }),
    },
    {
      id: "opponent",
      label: "Opponent",
      format: (value: string | number) => String(value),
    },
    { id: "club", label: "Club", format: (value: unknown) => String(value) },
    {
      id: "position",
      label: "Position",
      format: (value: string | number) => t(String(value)),
    },
  ];
  // Stores the amount of time left until the game starts
  const [countdown, setCountown] = useState<number>(
    (player.game.gameStart - Date.now() / 1000) / 60,
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [rows, setRows] = useState<
    Record<string, Data | { time: number; loading: true }>
  >({});
  // Sets the starting piece of data when a new player gets loaded
  useEffect(() => {
    setPage(0);
    // Sets the starting value to crazy high time and sets it to the starting amount
    setRows({
      "9999999999999999": {
        time: 0,
        value: player.value,
        last_match: player.last_match,
        average_points: player.average_points,
        total_points: player.total_points,
        opponent: player.game.opponent,
        club: player.club,
        position: player.position,
        exists: player.exists,
        forecast: player.forecast,
        loading: false,
      },
    });
  }, [uid, player]);
  // Loads the data up to that amount(If on the server nothing new is loaded)
  useEffect(() => {
    let count = page * rowsPerPage + rowsPerPage;
    times.forEach((time) => {
      count--;
      if (count > 0) {
        if (rows[String(time)] === undefined) {
          setRows((rows) => {
            const newRows = { ...rows };
            newRows[String(time)] = { time, loading: true };
            return newRows;
          });
          fetch(`/api/player/${league}/${uid}?time=${time}`)
            .then((e) => e.json())
            .then((data: apiPlayerResult) => {
              setRows((rows) => {
                const newRows = { ...rows };
                newRows[String(time)] = {
                  time,
                  value: data.value,
                  last_match: data.last_match,
                  average_points: data.average_points,
                  total_points: data.total_points,
                  club: data.club,
                  opponent: data.game ? data.game.opponent : "",
                  position: data.position,
                  exists: data.exists,
                  forecast: data.forecast,
                  loading: false,
                };
                return newRows;
              });
            });
        }
      }
    });
  }, [page, rowsPerPage, league, rows, times, uid]);
  // Used to change the page
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  // Used to change the number of rows per page
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  // Used to handle the dialog closing
  const handleDialogToggle = () => {
    setDialogVisible((e) => !e);
  };
  // Used to search for more data
  useEffect(() => {
    const id = setInterval(
      () => setCountown((countdown) => (countdown > 0 ? countdown - 1 : 0)),
      60000,
    );
    return () => {
      clearInterval(id);
    };
  }, []);
  // Calculates the number of rows that have not been loaded but should be
  let tempUnloaded =
    page * rowsPerPage + rowsPerPage - Object.values(rows).length;
  if (page * rowsPerPage + rowsPerPage > times.length) {
    tempUnloaded -= page * rowsPerPage + rowsPerPage - times.length;
  }
  const unloadedRows = tempUnloaded > 0 ? tempUnloaded : 0;
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  // Calculates the height and width for the official picture
  const pictureHeight =
    pictures.filter((e) => e.id === player.pictureID)[0].height || 200;
  const pictureWidth =
    pictures.filter((e) => e.id === player.pictureID)[0].width || 200;
  return (
    <>
      <Head>
        <title>{player.name}</title>
      </Head>
      <Menu />
      <h1>
        {player.name} ({t(player.position)}) - {player.club}
      </h1>
      <Image
        src={"/api/picture/" + player.pictureID}
        alt=""
        width={pictureWidth * 3}
        height={pictureHeight * 3}
      />
      <Dialog
        onClose={handleDialogToggle}
        open={dialogVisible}
        title={t("Historical Pictures")}
      >
        <>
          <p>{t("The newest pictures are on the top. ")}</p>
          {pictures.map((e) => (
            <div key={e.id}>
              <Image
                src={"/api/picture/" + e.id}
                alt=""
                width={(e.width || 200) * 3}
                height={(e.height || 200) * 3}
              />
            </div>
          ))}
        </>
      </Dialog>
      <br></br>
      <Button variant={"outlined"} onClick={handleDialogToggle}>
        {t("Historical Pictures")}
      </Button>
      <h2>{t("Current Player Info")}</h2>
      <p>
        {t("League")} : {league}
      </p>
      <p>
        {t("Value")} : {player.value / 1000000}M
      </p>
      <p>
        {t("Total Points")} : {player.total_points}
      </p>
      <p>
        {t("Average Points")} : {player.average_points}
      </p>
      <p>
        {t("Last Match")} : {player.last_match}
      </p>
      <p>
        {t("Opponent")} :{" "}
        {countdown > 0
          ? t("{team} in {day} D {hour} H {minute} M ", {
              team: player.game.opponent,
              day: String(Math.floor(countdown / 60 / 24)),
              hour: String(Math.floor(countdown / 60) % 24),
              minute: String(Math.floor(countdown) % 60),
            })
          : player.game.opponent}
      </p>
      {otherLeagues.length > 0 && (
        <>
          <h2>{t("Other Leagues")}</h2>
          <p>{t("This player was found in the leagues listed below. ")}</p>
          <ul>
            {otherLeagues.map((e) => (
              <li key={e.league}>
                <Link href={`/player/${e.league}/${e.uid}`}>{t(e.league)}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>{t("Historical Data Table")}</h2>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id}>{t(column.label)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(rows)
                .sort((e) => e.time)
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  if (row.loading) {
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={String(row.time)}
                      >
                        <TableCell colSpan={7}>
                          {t("Loading")}
                          <LinearProgress />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  // Gets the background color based on the status of the player
                  let background;
                  if (row.forecast == "u") {
                    background = dark ? "rgb(50, 50, 0)" : "rgb(255, 255, 220)";
                  } else if (row.forecast == "m") {
                    background = dark ? "rgb(50, 0, 0)" : "rgb(255, 200, 200)";
                  }
                  // Checks if the player exists
                  if (!row.exists) {
                    background = dark ? "rgb(50, 0, 50)" : "rgb(255, 235, 255)";
                  }
                  return (
                    <TableRow
                      style={{ background }}
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.time}
                    >
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id}>
                            {column.format(value)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              {Array(unloadedRows)
                .fill(0)
                .map((e, idx) => {
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={String(idx)}
                    >
                      <TableCell colSpan={7}>
                        Loading...
                        <LinearProgress />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[1, 5, 10, 25, 5000]}
          component="div"
          count={times.length + 1}
          rowsPerPage={rowsPerPage}
          page={times.length + 1 >= page * rowsPerPage ? page : 0}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const connection = await connect();
  const uid = ctx.params?.uid as string;
  const league = ctx.params?.league as string;
  // This makes the program wait until all updates are completed
  while (
    await connection
      .query("SELECT * FROM data WHERE value1=?", ["locked" + league])
      .then((res) => res.length > 0)
  ) {
    await new Promise((res) => setTimeout(res, 500));
  }
  const player: extendedPlayers[] = await connection.query(
    "SELECT * FROM players WHERE uid=? AND league=?",
    [uid, league],
  );
  if (player.length == 0) {
    return {
      notFound: true,
    };
  }
  const otherLeagues = await connection
    .query("SELECT * FROM players WHERE nameAscii=? AND league!=?", [
      player[0].nameAscii,
      league,
    ])
    .then((e: players[]) =>
      e.map((e) => {
        return { league: e.league, uid: e.uid };
      }),
    );
  // Gets some more player data
  const gameData = await connection
    .query("SELECT * FROM clubs WHERE club=? AND league=?", [
      player[0].club,
      league,
    ])
    .then((res) =>
      res.length > 0
        ? { opponent: res[0].opponent, gameStart: res[0].gameStart }
        : undefined,
    );
  if (gameData) player[0].game = gameData;
  // Gets all the pictures in a set
  const pictures = new Set<number>();
  pictures.add(player[0].pictureID);
  // Gets all the historical times in an array
  const times = await connection
    .query(
      "SELECT * FROM historicalPlayers WHERE uid=? AND league=? ORDER BY time DESC",
      [uid, league],
    )
    .then((res) => {
      const result: number[] = [];
      res.forEach((e: historicalPlayers) => {
        result.push(e.time);
        pictures.add(e.pictureID);
      });
      return result;
    });
  connection.end();
  // Sends a request to download every picture needed
  const pictureData: pictures[] = await Promise.all(
    Array.from(pictures).map(
      (e) =>
        new Promise<pictures>(async (res) => {
          const data = await downloadPicture(e);
          res({ ...data, id: e });
        }),
    ),
  );
  return {
    props: {
      uid,
      player: player[0],
      times,
      league,
      otherLeagues,
      pictures: pictureData,
      t: await getLocales(ctx.locale),
    },
  };
};
