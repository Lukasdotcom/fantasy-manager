import connect from "#database";
import { analytics, detailedAnalytics } from "#types/database";

/**
 * Turns the days of the analytics in the db into one entry in the final analytics table
 *
 * @param day The day of the week that should be compiled
 *
 */
export default async function compileAnalytics(day: number) {
  const connection = await connect();
  // Makes sure that if there was a duplicate for some reason it is ignored
  const analytics: detailedAnalytics[] = await connection.query(
    "SELECT DISTINCT * FROM detailedAnalytics WHERE day = ?",
    [day],
  );
  const previousAnalytics: analytics[] = await connection.query(
    "SELECT * FROM analytics WHERE day = ?",
    [day - 1],
  );
  type analyticsData = { [key: string]: number };
  let versionActive: analyticsData = {};
  let versionTotal: analyticsData = {};
  let leagueActive: analyticsData = {};
  let leagueTotal: analyticsData = {};
  let themeActive: analyticsData = {};
  let themeTotal: analyticsData = {};
  let localeActive: analyticsData = {};
  let localeTotal: analyticsData = {};
  // Makes sure the dictionaries for the analytics are prefilled with all required information
  if (previousAnalytics.length > 0) {
    const previousEntry = previousAnalytics[0];
    versionActive = JSON.parse(previousEntry.versionActive);
    for (const version in versionActive) {
      versionActive[version] = 0;
    }
    versionTotal = JSON.parse(previousEntry.versionTotal);
    for (const version in versionTotal) {
      versionTotal[version] = 0;
    }
    leagueActive = JSON.parse(previousEntry.leagueActive);
    for (const league in leagueActive) {
      leagueActive[league] = 0;
    }
    leagueTotal = JSON.parse(previousEntry.leagueTotal);
    for (const league in leagueTotal) {
      leagueTotal[league] = 0;
    }
    themeActive = JSON.parse(previousEntry.themeActive);
    for (const theme in themeActive) {
      themeActive[theme] = 0;
    }
    themeTotal = JSON.parse(previousEntry.themeTotal);
    for (const theme in themeTotal) {
      themeTotal[theme] = 0;
    }
    localeActive = JSON.parse(previousEntry.localeActive);
    for (const locale in localeActive) {
      localeActive[locale] = 0;
    }
    localeTotal = JSON.parse(previousEntry.localeTotal);
    for (const locale in localeTotal) {
      localeTotal[locale] = 0;
    }
  }
  // Goes through every servers analytics and adds them to the dictionaries
  for (const entry of analytics) {
    if (versionActive[entry.version] === undefined) {
      versionActive[entry.version] = 0;
    }
    versionActive[entry.version] += entry.active;
    if (versionTotal[entry.version] === undefined) {
      versionTotal[entry.version] = 0;
    }
    versionTotal[entry.version] += entry.total;
    const leagueActiveEntry: analyticsData = JSON.parse(entry.leagueActive);
    for (const league in leagueActiveEntry) {
      if (leagueActive[league] === undefined) {
        leagueActive[league] = 0;
      }
      leagueActive[league] += leagueActiveEntry[league];
    }
    const leagueTotalEntry = JSON.parse(entry.leagueTotal);
    for (const league in leagueTotalEntry) {
      if (leagueTotal[league] === undefined) {
        leagueTotal[league] = 0;
      }
      leagueTotal[league] += leagueTotalEntry[league];
    }
    const themeActiveEntry = JSON.parse(entry.themeActive);
    for (const theme in themeActiveEntry) {
      if (themeActive[theme] === undefined) {
        themeActive[theme] = 0;
      }
      themeActive[theme] += themeActiveEntry[theme];
    }
    const themeTotalEntry = JSON.parse(entry.themeTotal);
    for (const theme in themeTotalEntry) {
      if (themeTotal[theme] === undefined) {
        themeTotal[theme] = 0;
      }
      themeTotal[theme] += themeTotalEntry[theme];
    }
    const localeActiveEntry = JSON.parse(entry.localeActive);
    for (const locale in localeActiveEntry) {
      if (localeActive[locale] === undefined) {
        localeActive[locale] = 0;
      }
      localeActive[locale] += localeActiveEntry[locale];
    }
    const localeTotalEntry = JSON.parse(entry.localeTotal);
    for (const locale in localeTotalEntry) {
      if (localeTotal[locale] === undefined) {
        localeTotal[locale] = 0;
      }
      localeTotal[locale] += localeTotalEntry[locale];
    }
  }
  await connection.query("DELETE FROM analytics WHERE day=?", [day]);
  await connection.query(
    "INSERT INTO analytics (day, versionActive, versionTotal, leagueActive, leagueTotal, themeActive, themeTotal, localeActive, localeTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      day,
      JSON.stringify(versionActive),
      JSON.stringify(versionTotal),
      JSON.stringify(leagueActive),
      JSON.stringify(leagueTotal),
      JSON.stringify(themeActive),
      JSON.stringify(themeTotal),
      JSON.stringify(localeActive),
      JSON.stringify(localeTotal),
    ],
  );
  await connection.end();
  return;
}
