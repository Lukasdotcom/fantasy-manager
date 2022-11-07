import { clubs, forecast, players, position } from "../../Modules/database";
import noAccents from "../../Modules/normalize";
import dataGetter from "../../types/data";
import { Bundesliga } from "../../types/data/Bundesliga";

export default async function Main(
  file: string | undefined = undefined
): Promise<dataGetter> {
  const nowTime = Math.floor(Date.now() / 1000);
  // Gets the data for the league
  const data: Bundesliga = file
    ? (await import(file)).default
    : await fetch("https://fantasy.bundesliga.com/api/player_transfers/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `access_token=${process.env.BUNDESLIGA_API}`,
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
      // Ift the game already starts a 100 second buffer is created
      const gameStart =
        e.player.match_starts_in > 0
          ? e.player.match_starts_in + nowTime
          : nowTime - 100;
      clubList[club] = {
        club,
        gameStart,
        opponent: e.player.next_opponent.team_code,
        league: "Bundesliga",
      };
    }
    // Converts the data to the specified form
    return {
      uid: e.player.uid,
      name: e.player.nickname,
      nameAscii: noAccents(e.player.nickname),
      club,
      pictureUrl: e.player.image_urls.default,
      value: e.transfer_value,
      position: e.player.positions[0] as position,
      forecast: e.attendance.forecast.substring(0, 1) as forecast,
      total_points: e.player.statistics.total_points,
      average_points: e.player.statistics.average_points,
      last_match: e.player.statistics.last_match_points,
      locked: e.player.is_locked,
      exists: true,
      league: "Bundesliga",
    };
  });
  return [
    data.opening_hour.opened,
    Math.floor(data.opening_hour.countdown / 1000),
    playerList,
    Object.values(clubList),
  ];
}
