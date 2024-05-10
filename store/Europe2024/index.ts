import { position } from "#/types/database";
import dataGetter, { players } from "#type/data";
import { PStatus, PlayersResult } from "./types";

const Main: dataGetter = async function () {
  // Gets the data for the league
  const data: PlayersResult = await fetch(
    "https://gaming.uefa.com/en/eurofantasy/services/feeds/players/players_2_en_1.json",
    {
      headers: {
        "User-Agent":
          // This adds a valid user agent
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
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
      value: player.value,
      position:
        player.skill >= positions.length ? "gk" : positions[player.skill],
      total_points: player.totPts,
      average_points: player.avgPlayerPts,
      last_match: player.lastGdPoints,
      exists: player.pStatus !== PStatus.Nis,
    };
  });
  return [true, 5, players, []];
};
export default Main;
