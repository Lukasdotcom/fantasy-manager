import { forecast, position } from "#/types/database";
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
    let forecast: forecast = "a";
    if (player.pStatus === PStatus.D) {
      forecast = "u";
    } else if (player.pStatus === PStatus.I || player.pStatus === PStatus.S) {
      forecast = "m";
    }
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
      forecast,
      total_points: player.totPts,
      average_points: player.avgPlayerPts,
      exists: player.pStatus !== PStatus.Nis,
    };
  });
  let transferOpen = true;
  let update_points_after_game_end = true;
  let countdown = 0;
  const game_data: ResultClubs = await fetch(
    "https://gaming.uefa.com/en/uclpredictor/api/v1/competition/3/season/current/predictor/match_days",
    {
      headers,
    },
  ).then(async (e) => {
    const json_data: ResultMatchday = await e.json();
    for (const matchday of json_data.data.items) {
      // Before the matchday
      if (matchday.start_at > nowTime) {
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
        // Checks if the first game has started
        transferOpen = data.data.items.every((game: GameItem) => {
          return game.status === GameStatus.NotStarted;
        });
        if (!transferOpen) {
          countdown = matchday.end_at - nowTime;
        }
        return data;
      }
    }
    // Means all the matchdays are over and will return data for the last one
    const data = await fetch(
      `https://gaming.uefa.com/en/uclpredictor/api/v1/competition/3/season/current/predictor/matches/${json_data.data.items[json_data.data.items.length - 1].id}`,
      {
        headers,
      },
    ).then((e) => e.json());
    update_points_after_game_end = false; // Will set this to false to not change the points for players after this is done
    // Checks if the first game has started
    transferOpen = false;
    return data;
  });
  const clubs = [];
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
    // Updates the countdown if no game has started yet to be the time to the first game
    if (game.status === GameStatus.NotStarted && transferOpen) {
      const temp_countdown = gameStart - nowTime;
      if (temp_countdown < countdown || countdown === 0) {
        countdown = temp_countdown;
      }
    }
    clubs.push({
      club: game.home_team.name_short,
      fullName: game.home_team.name,
      test: 12,
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
      fullName: game.away_team.name,
      gameStart,
      gameEnd,
      opponent: game.home_team.name_short,
      teamScore: game.away_team_score,
      opponentScore: game.home_team_score,
      league: "Euro2024",
      home: false,
    });
  }
  if (countdown < 0) {
    countdown = 0;
  }
  return [
    transferOpen,
    countdown,
    players,
    clubs as clubs[],
    { update_points_after_game_end },
  ];
};
export default Main;
