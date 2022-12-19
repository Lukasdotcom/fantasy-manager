import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { useState, useEffect, useContext } from "react";
import { TransferPlayer as Player } from "../../components/Player";
import { push } from "@socialgouv/matomo-next";
import { SessionProvider, useSession } from "next-auth/react";
import connect from "../../Modules/database";
import Link from "../../components/Link";
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
} from "@mui/material";
import { Box } from "@mui/system";
import { TranslateContext } from "../../Modules/context";

// Shows the amount of transfers left
function TransfersLeft({ ownership, allowedTransfers, transferCount }) {
  const session = useSession();
  const t = useContext(TranslateContext);
  const user = session.data ? session.data.user.id : 1;
  return (
    <p>
      {t("{amount} transfers left", {
        amount:
          Object.values(ownership).filter(
            (e) => e.filter((e) => e.owner === user).length > 0
          ).length == 0
            ? t("Unlimited")
            : allowedTransfers - transferCount,
      })}
    </p>
  );
}
// Used for the selecting and unselecting of a position
function Postion({ position, positions, setPositions }) {
  const t = useContext(TranslateContext);
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={positions.includes(position)}
            onChange={(e) => {
              e.target.checked
                ? setPositions([...positions, position])
                : setPositions(positions.filter((e2) => e2 != position));
            }}
          />
        }
        label={t(position)}
      />
    </>
  );
}
function MainPage({
  league,
  allowedTransfers,
  duplicatePlayers,
  leagueName,
  maxPrice,
  leagueType,
  matchdayTransfers,
}) {
  const positionList = ["gk", "def", "mid", "att"];
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState(positionList);
  const [money, setMoney] = useState(0);
  const [ownership, setOwnership] = useState({});
  const [transferCount, setTransferCount] = useState(0);
  const [orderBy, setOrderBy] = useState("value");
  const [showHidden, setShowHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [open, setOpen] = useState(true);
  const [clubSearch, setClubSearch] = useState("");
  const [price, setPrice] = useState([0, Math.ceil(maxPrice / 500000) / 2]);
  const t = useContext(TranslateContext);
  useEffect(() => {
    search(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, positions, orderBy, showHidden, clubSearch, price]);
  // Used to get the data for a list of transfers and money
  function transferData() {
    fetch(`/api/transfer/${league}`).then(async (val) => {
      val = await val.json();
      setMoney(val.money);
      setOwnership(val.ownership);
      setTransferCount(val.transferCount);
      setTimeLeft(val.timeLeft);
      setOpen(val.transferOpen);
    });
  }
  // Used to lower the time left by one every second
  useEffect(() => {
    const id = setInterval(
      () => setTimeLeft((timeLeft) => (timeLeft > 0 ? timeLeft - 1 : 0)),
      1000
    );
    return () => {
      clearInterval(id);
    };
  }, []);
  // Used to calculate transfer message
  let transferMessage = (
    <p>
      {t("Transfer Market {open} for {day} D {hour} H {minute} M {second} S", {
        open: open ? t("open") : t("closed"),
        day: Math.floor(timeLeft / 3600 / 24),
        hour: Math.floor(timeLeft / 3600) % 24,
        minute: Math.floor(timeLeft / 60) % 60,
        second: timeLeft % 60,
      })}
    </p>
  );
  useEffect(transferData, [league]);
  // Used to search the isNew is used to check if it should reload everything back from the start
  async function search(isNew) {
    let length = -1;
    if (!isNew) {
      if (finished) {
        return;
      } else {
        length = players.length;
      }
    } else {
      setPlayers([]);
      push(["trackEvent", "Search Transfer", "Search Term", searchTerm]);
      push([
        "trackEvent",
        "Search Transfer",
        "Positions",
        JSON.stringify(positions),
      ]);
      push(["trackEvent", "Search Transfer", "Order By", orderBy]);
      push([
        "trackEvent",
        "Search Transfer",
        "Show Hidden",
        JSON.stringify(showHidden),
      ]);
      push(["trackEvent", "Search Transfer", "Club Search", clubSearch]);
      setFinished(false);
    }
    // Gets the data and returns the amount of players found
    setLoading(true);
    const newLength = await fetch(
      `/api/player/${leagueType}/search?${
        isNew ? "" : `limit=${players.length + 50}&`
      }searchTerm=${encodeURIComponent(
        searchTerm
      )}&clubSearch=${encodeURIComponent(
        clubSearch
      )}&positions=${encodeURIComponent(
        JSON.stringify(positions)
      )}&order_by=${encodeURIComponent(orderBy)}&league=${league}&minPrice=${
        price[0] * 1000000
      }&maxPrice=${price[1] * 1000000}`
    ).then(async (val) => {
      val = await val.json();
      setPlayers(val);
      return val.length;
    });
    setLoading(false);
    if (newLength == length) {
      setFinished(true);
    } else {
      setFinished(false);
    }
  }
  return (
    <div
      className="main-content"
      onScroll={(e) => {
        // Checks if scrolled to the bottom
        const bottom =
          e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
        // Checks if there are only 2 players left that are not shown and if true requests 10 more players
        if (bottom < (e.target.scrollHeight / players.length) * 2) {
          search(false);
          setFinished(true);
        }
      }}
    >
      <Head>
        <title>{t("Transfers for {leagueName}", { leagueName })}</title>
      </Head>
      <Menu league={league} />
      <h1>{t("Transfers for {leagueName}", { leagueName })}</h1>
      <SessionProvider>
        <TransfersLeft
          ownership={ownership}
          allowedTransfers={allowedTransfers}
          transferCount={transferCount}
        />
      </SessionProvider>
      <p>{t("Money left: {amount} M", { amount: money / 1000000 })}</p>
      {transferMessage}
      <TextField
        onChange={(val) => {
          setSearchTerm(val.target.value);
        }}
        value={searchTerm}
        label="Search Player"
        id="searchPlayer"
      ></TextField>
      <TextField
        onChange={(val) => {
          setClubSearch(val.target.value);
        }}
        value={clubSearch}
        id="searchClub"
        label={t("Search Club")}
        helperText={t("Use the acronymn ex: FCB, VFB")}
      ></TextField>
      <br />
      <Box sx={{ width: 300, marginLeft: 2 }}>
        <FormLabel htmlFor="value">
          {t("Value: {price1} M to {price2} M", {
            price1: price[0],
            price2: price[1],
          })}
        </FormLabel>
        <Slider
          step={0.5}
          value={price}
          onChange={(a, value) => setPrice(value)}
          id="value"
          max={Math.ceil(maxPrice / 500000) / 2}
        />
      </Box>
      <br></br>
      <FormLabel htmlFor="order">{t("Sort players by: ")}</FormLabel>
      <Select
        value={orderBy}
        onChange={(val) => setOrderBy(val.target.value)}
        id="order"
      >
        {[
          ["value", "Value"],
          ["total_points", "Total Points"],
          ["average_points", "Average Points"],
          ["last_match", "Last Match"],
        ].map((val) => (
          <MenuItem key={val[0]} value={val[0]}>
            {t(val[1])}
          </MenuItem>
        ))}
      </Select>
      <br></br>
      <FormLabel component="legend">{t("Positions to search: ")}</FormLabel>
      <FormGroup>
        {positionList.map((position) => (
          <Postion
            key={position}
            position={position}
            positions={positions}
            setPositions={setPositions}
          />
        ))}
      </FormGroup>
      <FormControlLabel
        control={
          <Switch
            id="showHidden"
            onChange={(e) => {
              setShowHidden(e.target.checked);
            }}
            checked={showHidden}
          />
        }
        label={t("Show hidden players")}
      />
      <br />
      <Link href="/download">
        <Button>{t("Download Data")}</Button>
      </Link>
      <SessionProvider>
        {players.map((val) => (
          <Player
            key={val}
            uid={val}
            money={money}
            ownership={ownership[val]}
            league={league}
            transferLeft={transferCount < allowedTransfers}
            allOwnership={ownership}
            transferData={transferData}
            open={matchdayTransfers || open}
            duplicatePlayers={duplicatePlayers}
            leagueType={leagueType}
            showHidden={showHidden}
          />
        ))}
      </SessionProvider>
      {loading && <LinearProgress />}
    </div>
  );
}
export default function Home(props) {
  const t = useContext(TranslateContext);
  // Checks if the league is archived
  if (props.archived !== 0) {
    return (
      <>
        <Head>
          <title>
            {t("Transfers for {leagueName}", { leagueName: props.leagueName })}
          </title>
        </Head>
        <Menu league={props.league} />
        <h1>
          {t("Transfers for {leagueName}", { leagueName: props.leagueName })}
        </h1>
        <Alert severity={"warning"} className="notification">
          <AlertTitle>{t("This league is archived")}</AlertTitle>
          <p>{t("This league is archived and this screen is disabled. ")}</p>
        </Alert>
      </>
    );
  } else {
    return <MainPage {...props} />;
  }
}
export async function getServerSideProps(ctx) {
  const connection = await connect();
  // Gets the amount of allowed transfers
  const [allowedTransfers, duplicatePlayers, league] = await connection
    .query(
      "SELECT transfers, duplicatePlayers, league FROM leagueSettings WHERE leagueID=?",
      [ctx.params.league]
    )
    .then((result) =>
      result.length > 0
        ? [result[0].transfers, result[0].duplicatePlayers, result[0].league]
        : [0, 0, "Bundesliga"]
    );
  const maxPrice = await connection
    .query(
      "SELECT value FROM players WHERE league=? ORDER BY value DESC limit 1",
      [league]
    )
    .then((res) => (res.length > 0 ? res[0].value : 0));
  connection.end();
  return await redirect(ctx, { allowedTransfers, duplicatePlayers, maxPrice });
}
