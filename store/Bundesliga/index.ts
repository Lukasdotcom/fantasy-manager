import { clubs, forecast, position } from "#Modules/database";
import dataGetter, { players } from "#type/data";
import { Bundesliga } from "./types";
import { readFile } from "fs/promises";
const Main: dataGetter = async (settings, past_data) => {
  const nowTime = Math.floor(Date.now() / 1000);
  // Gets the data for the league, note that if a file is specified it will be used instead this is for testing purposes
  const data: Bundesliga = settings.file
    ? JSON.parse((await readFile(settings.file)).toString("utf-8"))
    : await fetch("https://fantasy.bundesliga.com/api/player_transfers/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `access_token=${settings.access_token}`,
        },
        body: JSON.stringify({
          payload: {
            offerings_query: {
              offset: 0,
              limit: 1000,
              sort: { order_by: "popularity", order_direction: "desc" },
            },
          },
        }),
      }).then((e) => e.json());
  const clubList: { [Key: string]: clubs } = {};
  const playerList = data.offerings.items.map((e): players => {
    const club = e.player.team.team_code;
    // If the club data for the team does not exist it gets added
    if (!clubList[club]) {
      let gameStart = e.player.match_starts_in + nowTime;
      if (e.player.match_starts_in <= 0) {
        const past_data_club = past_data.clubs.filter((e) => e.club == club);
        // If the game already starts a 100 second buffer is created if the game start time is not known
        gameStart =
          past_data_club.length > 0 && past_data_club[0].gameStart < nowTime
            ? past_data_club[0].gameStart
            : nowTime - 100;
      }
      clubList[club] = {
        club,
        gameStart,
        // It is assumed that every game will take less than 2.5 hours
        gameEnd: gameStart + 60 * 2.5 * 60,
        opponent: e.player.next_opponent.team_code,
        league: "Bundesliga",
      };
    }
    // Converts the data to the specified form
    const data: players = {
      uid: e.player.uid,
      name: e.player.nickname,
      club,
      pictureUrl: e.player.image_urls.default,
      height: 200,
      width: 200,
      value: e.transfer_value,
      position: e.player.positions[0] as position,
      forecast: e.attendance.forecast.substring(0, 1) as forecast,
      total_points: e.player.statistics.total_points,
      average_points: e.player.statistics.average_points,
      exists: true,
    };
    // Checks if the player has a sale price
    if (e.player.on_sale) {
      data.value = e.player.on_sale.suggested_transfer_value;
      data.sale_price = e.transfer_value;
    }
    return data;
  });
  return [
    data.opening_hour.opened,
    Math.floor(data.opening_hour.countdown / 1000),
    playerList,
    Object.values(clubList),
  ];
};
export default Main;
