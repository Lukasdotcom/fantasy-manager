import Head from "next/head";
import Menu from "../../../components/Menu";
import connect from "../../../Modules/database";
import redirect from "../../../Modules/league";
import { Player, HistoricalPlayer } from "../../../components/Player";
import { useRouter } from "next/router";
import { FormLabel, Pagination, PaginationItem } from "@mui/material";
import { useContext } from "react";
import { TranslateContext } from "../../../Modules/context";
export default function HistoricalView({
  user,
  username,
  squad,
  transfers,
  league,
  latestMatchday,
  currentMatchday, // This is the matchday requested to be seen by the user
  time, // Stores the time this is if historical player data needs to be gotten
  leagueName,
  money,
  value,
  leagueType,
}) {
  const router = useRouter();
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>
          {t("{username}'s squad {matchday} from {leagueName}", {
            username,
            matchday:
              currentMatchday === 0
                ? ""
                : t("on matchday {currentMatchday}", { currentMatchday }),
            leagueName,
          })}
        </title>
      </Head>
      <Menu league={league} />
      <h1>
        {t("{username}'s squad {matchday} from {leagueName}", {
          username,
          matchday:
            currentMatchday === 0
              ? ""
              : t("on matchday {currentMatchday}", { currentMatchday }),
          leagueName,
        })}
      </h1>
      <p>{t("Money left: {amount} M", { amount: money / 1000000 })}</p>
      {value && (
        <p>{t("Team value: {teamValue} M", { teamValue: value / 1000000 })}</p>
      )}
      <FormLabel id="matchdayLabel">{t("Select matchday")}</FormLabel>
      <Pagination
        page={
          currentMatchday == 0 ? latestMatchday + 1 : parseInt(currentMatchday)
        }
        count={latestMatchday + 1}
        onChange={(e, v) => {
          router.push(
            `/${league}/${user}/${v === latestMatchday + 1 ? "" : v}`,
          );
        }}
        renderItem={(item) => {
          if (item.page > latestMatchday) item.page = t("Latest");
          return <PaginationItem {...item} />;
        }}
      ></Pagination>
      <h2>{t("Attackers")}</h2>
      {squad
        .filter((e) => e.position === "att")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "att"}
                starred={e.starred}
                uid={e.playeruid}
                leagueType={leagueType}
              />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
              leagueType={leagueType}
            />
          );
        })}
      <h2>{t("Midfielders")}</h2>
      {squad
        .filter((e) => e.position === "mid")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "mid"}
                starred={e.starred}
                uid={e.playeruid}
                leagueType={leagueType}
              />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
              leagueType={leagueType}
            />
          );
        })}
      <h2>{t("Defenders")}</h2>
      {squad
        .filter((e) => e.position === "def")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "def"}
                starred={e.starred}
                uid={e.playeruid}
                leagueType={leagueType}
              />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              starred={e.starred}
              time={time}
              leagueType={leagueType}
            />
          );
        })}
      <h2>{t("Goalkeeper")}</h2>
      {squad
        .filter((e) => e.position === "gk")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "gk"}
                uid={e.playeruid}
                leagueType={leagueType}
              />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              time={time}
              leagueType={leagueType}
            />
          );
        })}
      <h2>{t("Bench")}</h2>
      {squad
        .filter((e) => e.position === "bench")
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "bench"}
                uid={e.playeruid}
                leagueType={leagueType}
              />
            );
          return (
            <HistoricalPlayer
              key={e.playeruid}
              uid={e.playeruid}
              time={time}
              leagueType={leagueType}
            />
          );
        })}
      <h1>{t("Transfers")}</h1>
      <h2>{t("Buying")}</h2>
      {transfers
        .filter((e) => e.buyer == user)
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "buy"}
                uid={e.playeruid}
                leagueType={leagueType}
              >
                <p>
                  {t("Buying for {amount} M", { amount: e.value / 1000000 })}
                </p>
              </Player>
            );
          return (
            <HistoricalPlayer
              key={e.playeruid + "buy"}
              uid={e.playeruid}
              time={time}
              leagueType={leagueType}
            >
              <p>{t("Bought for {amount} M", { amount: e.value / 1000000 })}</p>
            </HistoricalPlayer>
          );
        })}
      <h2>{t("Selling")}</h2>
      {transfers
        .filter((e) => e.seller == user)
        .map((e) => {
          if (currentMatchday === 0)
            return (
              <Player
                key={e.playeruid + "sell"}
                uid={e.playeruid}
                leagueType={leagueType}
              >
                <p>
                  {t("Selling for {amount} M", { amount: e.value / 1000000 })}
                </p>
              </Player>
            );
          return (
            <HistoricalPlayer
              leagueType={leagueType}
              key={e.playeruid + "sell"}
              uid={e.playeruid}
              time={time}
            >
              <p>{t("Sold for {amount} M", { amount: e.value / 1000000 })}</p>
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
  const [squad, transfers, username, latestMatchday, money] = await Promise.all(
    [
      // Gets the latest squad of the user
      connection.query("SELECT * FROM squad WHERE leagueID=? AND user=?", [
        league,
        user,
      ]),
      // Gets all transfers at the moment from the user
      connection.query(
        "SELECT * FROM transfers WHERE leagueID=? AND (buyer=? OR seller=?)",
        [league, user, user],
      ),
      // Gets the username of the user
      connection
        .query("SELECT username FROM users WHERE id=?", [user])
        .then((e) => (e.length > 0 ? e[0].username : "")),
      // Gets the latest matchday in that league
      connection
        .query(
          "SELECT matchday FROM points WHERE leagueID=? and user=? ORDER BY matchday DESC",
          [league, user],
        )
        .then((res) => (res.length > 0 ? res[0].matchday : 0)),
      connection
        .query("SELECT money FROM leagueUsers WHERE leagueID=? and user=?", [
          league,
          user,
        ])
        .then((res) => (res.length > 0 ? res[0].money : 0)),
    ],
  );
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
    money,
  });
}
