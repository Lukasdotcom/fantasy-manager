import { position } from "#/types/database";
import dataGetter, { clubs, players } from "#type/data";
import { Status as GameStatus, Item as GameItem } from "./typeClubs";
import { PStatus } from "./typePlayers";
import { ResultClubs, ResultMatchday, ResultPlayers } from "./types";
const headers = {
  "User-Agent":
    // This adds a valid user agent
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};
const Main: dataGetter = async function () {
  const nowTime = Math.floor(Date.now() / 1000);
  // Gets the data for the league
  const data: ResultPlayers = await fetch(
    "https://gaming.uefa.com/en/eurofantasy/services/feeds/players/players_2_en_1.json",
    {
      headers,
    },
  ).then(async (e) => {
    return e.json();
  });
  const playerList = data.data.value.playerList;
  const positions: position[] = ["gk", "gk", "def", "mid", "att"];
  const players: players[] = playerList.map((player) => {
    return {
      uid: player.id,
      name: player.pFName,
      club: player.cCode,
      pictureUrl: `https://img.uefa.com/imgml/TP/players/3/2024/324x324/${player.id}.jpg`,
      height: 324,
      width: 324,
      value: player.value * 1000000,
      position:
        player.skill >= positions.length ? "gk" : positions[player.skill],
      total_points: player.totPts,
      average_points: player.avgPlayerPts,
      last_match: player.lastGdPoints,
      exists: player.pStatus !== PStatus.Nis,
    };
  });
  let countdown = 0;
  let transferOpen = true;
  const game_data: ResultClubs = await fetch(
    "https://gaming.uefa.com/en/uclpredictor/api/v1/competition/3/season/current/predictor/match_days",
    {
      headers,
    },
  ).then(async (e) => {
    const json_data: ResultMatchday = await e.json();
    const last_matchday_id =
      json_data.data.items[json_data.data.items.length - 1].id;
    for (const matchday of json_data.data.items) {
      // Before the matchday
      if (matchday.start_at > nowTime) {
        countdown = matchday.start_at - nowTime;
        return fetch(
          `https://gaming.uefa.com/en/uclpredictor/api/v1/competition/3/season/current/predictor/matches/${matchday.id}`,
          {
            headers,
          },
        ).then((e) => e.json());
      }
      // During the matchday
      else if (matchday.end_at > nowTime) {
        const data = await fetch(
          `https://gaming.uefa.com/en/uclpredictor/api/v1/competition/3/season/current/predictor/matches/${matchday.id}`,
          {
            headers,
          },
        ).then((e) => e.json());
        // Checks if any game is not finished note that the last matchday never ends
        const finished =
          matchday.id !== last_matchday_id &&
          data.data.items.exists((game: GameItem) => {
            return game.status !== GameStatus.Finished;
          });
        if (!finished) {
          transferOpen = false;
          return data;
        }
      }
    }
    // Should never get here, but just in case throws an error
    throw new Error("Failed to find the matchday for unknown reason");
  });

  const clubs: clubs[] = [];
  for (const game of game_data.data.items) {
    const gameStart = Date.parse(game.start_at) / 1000;
    let gameEnd = nowTime;
    if (game.status !== GameStatus.Finished) {
      gameEnd = gameStart + 60 * 60 * 3;
      // Makes sure the game will still take 5 minutes to end
      if (gameEnd <= nowTime + 300) {
        gameEnd = nowTime + 300;
      }
    }
    clubs.push({
      club: game.home_team.name_short,
      gameStart,
      gameEnd,
      opponent: game.away_team.name_short,
      teamScore: game.home_team_score,
      opponentScore: game.away_team_score,
      league: "Euro2024",
      home: true,
    });
    clubs.push({
      club: game.away_team.name_short,
      gameStart,
      gameEnd,
      opponent: game.home_team.name_short,
      teamScore: game.away_team_score,
      opponentScore: game.home_team_score,
      league: "Euro2024",
      home: false,
    });
  }
  return [transferOpen, countdown, players, clubs];
};
export default Main;
