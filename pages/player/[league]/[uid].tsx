import Menu from "../../../components/Menu";
import { GetServerSideProps } from "next";
import Head from "next/head.js";
import connect from "../../../Modules/database";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
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
interface props {
  uid: string;
  player: {
    name: string;
    position: string;
    club: string;
    pictureUrl: string;
    value: number;
    total_points: number;
    average_points: number;
    last_match: number;
    exists: 1 | 0;
    game: {
      opponent: string;
      gameStart: number;
    };
  };
  times: number[];
  league: string;
}
interface Column {
  id:
    | "time"
    | "value"
    | "last_match"
    | "average_points"
    | "total_points"
    | "club"
    | "position";
  label: string;
  format: (value: any) => string;
}
// An array of all the columns
const columns: Column[] = [
  {
    id: "time",
    label: "Time",
    format: (value: number) => {
      const date = new Date(value * 1000);
      return value === 0 ? "Now" : date.toDateString();
    },
  },
  {
    id: "value",
    label: "Value",
    format: (value: number) => `${value / 1000000}M`,
  },
  {
    id: "last_match",
    label: "Last Match Points",
    format: (value: number) => String(value),
  },
  {
    id: "average_points",
    label: "Average Points",
    format: (value: number) => String(value),
  },
  {
    id: "total_points",
    label: "Total Points",
    format: (value: number) => String(value),
  },
  { id: "club", label: "Club", format: (value: string) => value },
  { id: "position", label: "Position", format: (value: string) => value },
];

interface Data {
  time: number;
  value: number;
  last_match: number;
  average_points: number;
  total_points: number;
  club: string;
  position: string;
  exists: 1 | 0;
}
export default function Home({ player, times, uid, league }: props) {
  // Stores the amount of time left until the game starts
  const [countdown, setCountown] = useState<number>(
    (player.game.gameStart - Date.now() / 1000) / 60
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Sets the starting value to crazy high time and sets it to the starting amount
  const [rows, setRows] = useState<Record<string, Data>>({
    "9999999999999999": {
      time: 0,
      value: player.value,
      last_match: player.last_match,
      average_points: player.average_points,
      total_points: player.total_points,
      club: player.club,
      position: player.position,
      exists: player.exists,
    },
  });
  // Loads the data up to that amount(If on the server nothing new is loaded)
  useEffect(() => {
    let count = page * rowsPerPage + rowsPerPage;
    times.forEach((time) => {
      count--;
      if (count > 0) {
        if (rows[String(time)] === undefined) {
          fetch(`/api/player/${league}/${uid}?time=${time}`)
            .then((e) => e.json())
            .then((data) => {
              let newRows = { ...rows };
              newRows[String(time)] = data;
              setRows(newRows);
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
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  // Used to search for more data
  useEffect(() => {
    const id = setInterval(
      () => setCountown((countdown) => (countdown > 0 ? countdown - 1 : 0)),
      60000
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
  return (
    <>
      <Head>
        <title>{player.name}</title>
      </Head>
      <Menu />
      <h1>
        {player.name} ({player.position}) - {player.club}
      </h1>
      <Image
        src={player.pictureUrl}
        alt=""
        width={league === "EPL" ? 234 : 300}
        height={300}
      />
      <h2>Current Player Info</h2>
      <p>League: {league}</p>
      <p>Value : {player.value / 1000000}M</p>
      <p>Total Points(This season) : {player.total_points}</p>
      <p>Average Points(This season) : {player.average_points}</p>
      <p>Last Match : {player.last_match}</p>
      <p>
        Opponent : {player.game.opponent}{" "}
        {countdown > 0
          ? ` in ${Math.floor(countdown / 60 / 24)} D ${
              Math.floor(countdown / 60) % 24
            } H ${Math.floor(countdown) % 60} M`
          : ""}
      </p>
      <h2>Historical Data Table</h2>
      <p>
        All the ones with a purple background mean the player was not in the
        bundesliga during these matchdays.
      </p>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(rows)
                .sort((e) => e.time)
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row: Data) => {
                  return (
                    <TableRow
                      style={
                        row.exists == 0
                          ? {
                              background: dark
                                ? "rgb(50, 0, 50)"
                                : "rgb(255, 235, 255)",
                            }
                          : {}
                      }
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
          page={page}
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
  const player = await connection.query(
    "SELECT * FROM players WHERE uid=? AND league=?",
    [uid, league]
  );
  if (player.length == 0) {
    return {
      notFound: true,
    };
  }
  player[0].game = await connection
    .query("SELECT * FROM clubs WHERE club=? AND league=?", [
      player[0].club,
      league,
    ])
    .then((res) =>
      res.length > 0
        ? { opponent: res[0].opponent, gameStart: res[0].gameStart }
        : undefined
    );
  const times = await connection
    .query(
      "SELECT * FROM historicalPlayers WHERE uid=? AND league=? ORDER BY time DESC",
      [uid, league]
    )
    .then((res) => {
      let result: number[] = [];
      res.forEach((e: { time: number }) => {
        result.push(e.time);
      });
      return result;
    });
  connection.end();
  // Checks if the matchday exists
  return { props: { uid, player: player[0], times, league } };
};
