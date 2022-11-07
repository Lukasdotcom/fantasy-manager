import { clubs, forecast, players, position } from "../../Modules/database";
import noAccents from "../../Modules/normalize";
import dataGetter from "../../types/data";
import {
  Player,
  WorldCup2022Players,
  WorldCup2022Rounds,
  WorldCup2022Squads,
} from "../../types/data/WorldCup2022";

export default async function Main(): Promise<dataGetter> {
  const nowTime = Math.floor(Date.now() / 1000);
  // Gets the data for the league
  const data: WorldCup2022Players = await fetch(
    "https://play.fifa.com/json/fantasy/players.json"
  ).then((e) => e.json());
  let matchdayData: WorldCup2022Rounds = await fetch(
    "https://play.fifa.com/json/fantasy/rounds.json"
  ).then((e) => e.json());
  let squads: WorldCup2022Squads = await fetch(
    "https://play.fifa.com/json/fantasy/squads_fifa.json"
  ).then((e) => e.json());
  // Finds the Current Round
  let countdown = 0;
  let transfer = true;
  let round = 0;
  while (round < matchdayData.length) {
    // If it is before this matchday starts return that it is transfer time and countdown length
    if (Date.parse(String(matchdayData[round].startDate)) / 1000 >= nowTime) {
      countdown = Math.floor(
        Date.parse(String(matchdayData[round].startDate)) / 1000 - nowTime
      );
      break;
    }
    // If it is in the matchday
    if (Date.parse(String(matchdayData[round].endDate)) / 1000 >= nowTime) {
      transfer = false;
      countdown = Math.floor(
        Date.parse(String(matchdayData[round].endDate)) / 1000 - nowTime
      );
      break;
    }
    round += 1;
  }
  // Gets the short_name for the club with this id
  const getTeam = (id: number): string => {
    const result = squads.filter((e) => e.id === id);
    if (result.length > 0) {
      return result[0].abbr;
    } else {
      return "NA";
    }
  };
  // Gets all the teams into a list
  const teams: clubs[] = [];
  matchdayData[round].tournaments.forEach((game) => {
    const home = getTeam(game.homeSquadId);
    const away = getTeam(game.awaySquadId);
    const gameStart = Math.floor(Date.parse(String(game.date)) / 1000);
    teams.push({
      club: home,
      gameStart,
      opponent: away,
      league: "WorldCup2022",
    });
    teams.push({
      club: away,
      gameStart,
      opponent: home,
      league: "WorldCup2022",
    });
  });
  // Gets all the player data
  const players = data.map((e: Player): players => {
    let forecast: forecast = "u";
    if (e.status === "available") {
      forecast = "a";
    }
    return {
      uid: String(e.id),
      name: e.name,
      nameAscii: noAccents(e.name),
      club: getTeam(e.squadId),
      pictureUrl: `https://play.fifa.com/media/squads/${
        e.position === 1 ? "goalkeeper" : "outfield"
      }/${e.squadId}.png`,
      value: e.cost,
      position: ["", "gk", "def", "mid", "att"][e.position] as position,
      forecast,
      total_points: e.stats.total_points ? e.stats.total_points : 0,
      average_points: e.stats.average_points ? e.stats.average_points : 0,
      last_match: 0,
      locked: e.locked === 1,
      exists: true,
      league: "WorldCup2022",
    };
  });
  return [transfer, countdown, players, teams];
}
