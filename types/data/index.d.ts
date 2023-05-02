import { forecast, position } from "#Modules/database";

export interface players {
  uid: string; // This is the unique id of the player
  name: string; // This is the name of the player
  club: string; // This is the club of the player
  pictureUrl: string; // This is the url of the picture of the player
  value: number; // This is the value of the player
  position: position; // This is the position of the player
  forecast?: forecast; // This is the forecast of the player where a is attending u is unknown and m is missing
  total_points?: number; // This is the total points of the player
  average_points?: number; // This is the average points of the player per game
  last_match?: number; // This is the points in the last match of the player
  exists?: boolean; // This can be set to false to update a player that does not exist anymore
}

// These are the types for the data getter functions
export type result = [boolean, number, players[], clubs[]];
type dataGetter = (settings: { [key: string]: string }) => Promise<result>;
export default dataGetter;
