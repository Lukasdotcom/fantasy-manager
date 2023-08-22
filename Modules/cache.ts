import { timeUntilUpdate } from "#/scripts/checkUpdate";
/**
 * Returns the cache length for a league.
 * @param {string} league - The league you want to check.
 * @return {number} The length in seconds that player data can safely be cached for this league.
 */
export const cache = async (league: string): Promise<number> => {
  let timeLeft = await timeUntilUpdate(league);
  timeLeft = timeLeft > 0 ? timeLeft : 0;
  return timeLeft;
};
