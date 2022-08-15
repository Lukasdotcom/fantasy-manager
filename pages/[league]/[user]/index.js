import Head from "next/head";
import Menu from "../../../components/Menu";
import connect from "../../../Modules/database.mjs";
import redirect from "../../../Modules/league";
import { Player, HistoricalPlayer } from "../../../components/Player";
import { useRouter } from "next/router";
import { FormLabel, MenuItem, Select } from "@mui/material";
export default function HistoricalView({
  session,
  user,
  username,
  squad,
  transfers,
  league,
  latestMatchday,
  currentMatchday, // This is the matchday requested to be seen by the user
  time, // Stores the time this is if historical player data needs to be gotten
  leagueName,
}) {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>
          {`${username}'s Squad  
          ${currentMatchday === 0 ? "" : `on Matchday ${currentMatchday} `}
          from ${leagueName}`}
        </title>
      </Head>
      <Menu session={session} league={league} />
      <h1>
        {username}&apos;s Squad{" "}
        {currentMatchday === 0 ? "" : `on Matchday ${currentMatchday} `}
        from {leagueName}
      </h1>
      <FormLabel id="matchdayLabel">Select Matchday</FormLabel>
      <Select
        onChange={(e) => {
          router.push(
            `/${league}/${user}/${
              e.target.value === "latest" ? "" : e.target.value
            }`
          );
        }}
        value={currentMatchday === 0 ? "latest" : currentMatchday}
        id="matchday"
        labelId="matchdayLabel"
      >
        {Array(latestMatchday)
          .fill(0)
          .map((a, index) => (
            <MenuItem key={index + 1} value={index + 1}>
              {index + 1}
            </MenuItem>
          ))}
        <MenuItem value="latest">latest</MenuItem>
      </Select>
      <h2>Attackers</h2>
      {squad
        .filter((e) => e.position === "att")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player key={e.playeruid} starred={e.starred} uid={e.playeruid} />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
            />
          );
        })}
      <h2>Midfielders</h2>
      {squad
        .filter((e) => e.position === "mid")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player key={e.playeruid} starred={e.starred} uid={e.playeruid} />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
            />
          );
        })}
      <h2>Defenders</h2>
      {squad
        .filter((e) => e.position === "def")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player key={e.playeruid} starred={e.starred} uid={e.playeruid} />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
            />
          );
        })}
      <h2>Goalkeeper</h2>
      {squad
        .filter((e) => e.position === "gk")
        .map((e) => {
          if (currentMatchday === 0)
            return <Player key={e.playeruid} uid={e.playeruid} />;
          return (
            <HistoricalPlayer key={e.playeruid} uid={e.playeruid} time={time} />
          );
        })}
      <h2>Bench</h2>
      {squad
        .filter((e) => e.position === "bench")
        .map((e) => {
          if (currentMatchday === 0)
            return <Player key={e.playeruid} uid={e.playeruid} />;
          return (
            <HistoricalPlayer key={e.playeruid} uid={e.playeruid} time={time} />
          );
        })}
      <h1>Transfers</h1>
      <h2>Buying</h2>
      {transfers
        .filter((e) => e.buyer == user)
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player key={e.playeruid} uid={e.playeruid}>
                <p>Buying for {e.value / 1000000}M</p>
              </Player>
            );
          return (
            <HistoricalPlayer key={e.playeruid} uid={e.playeruid} time={time}>
              <p>Bought for {e.value / 1000000}M</p>
            </HistoricalPlayer>
          );
        })}
      <h2>Selling</h2>
      {transfers
        .filter((e) => e.seller == user)
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player key={e.playeruid} uid={e.playeruid}>
                <p>Selling for {e.value / 1000000}M</p>
              </Player>
            );
          return (
            <HistoricalPlayer key={e.playeruid} uid={e.playeruid} time={time}>
              <p>Sold for {e.value / 1000000}M</p>
            </HistoricalPlayer>
          );
        })}
    </>
  );
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  const user = ctx.params.user;
  const league = ctx.params.league;
  const [squad, transfers, username, latestMatchday, leagueName] =
    await Promise.all([
      // Gets the latest squad of the user
      connection.query("SELECT * FROM squad WHERE leagueID=? AND user=?", [
        league,
        user,
      ]),
      // Gets all transfers at the moment from the user
      connection.query(
        "SELECT * FROM transfers WHERE leagueID=? AND (buyer=? OR seller=?)",
        [league, user, user]
      ),
      // Gets the username of the user
      connection
        .query("SELECT username FROM users WHERE id=?", [user])
        .then((e) => (e.length > 0 ? e[0].username : "")),
      // Gets the latest matchday in that league
      connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? and user=? ORDER BY matchday DESC",
          [league, user]
        )
        .then((res) => (res.length > 0 ? res[0].matchday : 0)),
      // Gets the league name
      connection
        .query("SELECT * FROM leagueSettings WHERE leagueID=?", [league])
        .then((res) => (res.length > 0 ? res[0].leagueName : 0)),
    ]);
  connection.end();
  // Checks if the user exists
  if (username === "") {
    return {
      notFound: true,
    };
  }
  return await redirect(ctx, {
    user,
    username,
    squad,
    transfers,
    league,
    latestMatchday,
    currentMatchday: 0,
  });
}
