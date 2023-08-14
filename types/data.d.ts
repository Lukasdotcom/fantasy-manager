import { forecast, position, clubs } from "#Modules/database";

export interface players {
  uid: string; // This is the unique id of the player
  name: string; // This is the name of the player
  club: string; // This is the club of the player
  pictureUrl: string; // This is the url of the picture of the player
  height: number; // This is the height of the picture of the player
  width: number; // This is the width of the picture of the player
  value: number; // This is the value of the player
  sale_price?: number; // This is the sale price of the player
  position: position; // This is the position of the player
  forecast?: forecast; // This is the forecast of the player where a is attending u is unknown and m is missing
  total_points?: number; // This is the total points of the player
  average_points?: number; // This is the average points of the player per game
  last_match?: number; // This is the points in the last match of the player
  exists?: boolean; // This can be set to false to update a player that does not exist anymore
  [key: string]: unknown; // This is so the type definition will work for new versions
}

// These are the types for the data getter functions
export type result = [boolean, number, players[], clubs[]];
type dataGetter = (
  settings: { [key: string]: string },
  past_data: {
    players: players[];
    clubs: clubs[];
    timestamp: number;
    [key: string]: unknown;
  },
) => Promise<result>;
export default dataGetter;
