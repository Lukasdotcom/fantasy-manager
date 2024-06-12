export type position = "bench" | "gk" | "def" | "mid" | "att";
export type forecast = "a" | "u" | "m";
// These are the types for the database
export interface users {
  id: number;
  username: string;
  password: string;
  throttle: number;
  active: boolean;
  inActiveDays: number;
  google: string;
  github: string;
  admin: boolean;
  favoriteLeague: number | null;
  theme: string | null;
  locale: string | null;
}
export interface players {
  uid: string;
  name: string;
  nameAscii: string;
  club: string;
  pictureID: number;
  value: number;
  sale_price: number;
  position: position;
  forecast: forecast;
  total_points: number;
  average_points: number;
  last_match: number;
  locked: boolean;
  exists: boolean;
  league: string;
}
export interface data {
  value1: string;
  value2: string;
}
export interface leagueSettings {
  leagueName: string;
  leagueID: number;
  startMoney: number;
  transfers: number;
  duplicatePlayers: number;
  starredPercentage: number;
  league: string;
  archived: number;
  matchdayTransfers: boolean;
  fantasyEnabled: boolean;
  predictionsEnabled: boolean;
  predictWinner: number;
  predictDifference: number;
  predictExact: number;
  top11: boolean;
  active: boolean;
  inActiveDays: number;
}
export interface leagueUsers {
  leagueID: number;
  user: number;
  fantasyPoints: number;
  predictionPoints: number;
  points: number;
  money: number;
  formation: string;
  admin: boolean;
  tutorial: boolean;
}
export interface points {
  leagueID: number;
  user: number;
  fantasyPoints: number;
  predictionPoints: number;
  points: number;
  matchday: number;
  money: number;
  time: number;
}
export interface transfers {
  leagueID: number;
  seller: number;
  buyer: number;
  playeruid: string;
  value: number;
  position: position;
  starred: boolean;
  max: number;
}
export interface invite {
  inviteID: string;
  leagueID: number;
}
export interface squad {
  leagueID: number;
  user: number;
  playeruid: string;
  position: position;
  starred: boolean;
}
export interface historicalSquad extends squad {
  matchday: number;
}
export interface historicalPlayers {
  time: number;
  uid: string;
  name: string;
  nameAscii: string;
  club: string;
  pictureID: number;
  value: number;
  sale_price: number;
  position: position;
  forecast: forecast;
  total_points: number;
  average_points: number;
  last_match: number;
  exists: boolean;
  league: string;
}
export interface historicalTransfers {
  matchday: number;
  leagueID: number;
  seller: number;
  buyer: number;
  playeruid: string;
  value: number;
}
export interface clubs {
  club: string;
  fullName?: string;
  gameStart: number;
  gameEnd: number;
  opponent: string;
  teamScore?: number;
  opponentScore?: number;
  league: string;
  home: boolean;
  exists: boolean;
}
export interface historicalClubs {
  club: string;
  fullName?: string;
  opponent: string;
  teamScore?: number;
  opponentScore?: number;
  league: string;
  home: boolean;
  time: number;
  exists: boolean;
}
// Stores every servers analytics data
export interface detailedAnalytics {
  serverID: string;
  day: number;
  version: string;
  active: number;
  total: number;
  leagueActive: string;
  leagueTotal: string;
  themeActive: string;
  themeTotal: string;
  localeActive: string;
  localeTotal: string;
}
// Stores the analytics data combined for all the servers
export interface analytics {
  day: number;
  versionActive: string;
  versionTotal: string;
  leagueActive: string;
  leagueTotal: string;
  themeActive: string;
  themeTotal: string;
  localeActive: string;
  localeTotal: string;
}
// Stores all the plugin settings
export interface plugins {
  name: string;
  settings: string; // JSON of all the settings
  enabled: boolean;
  installed: boolean;
  url: string;
  version: string;
}
export interface pictures {
  id: number;
  url: string;
  downloading: boolean; // If the picture has started downloading
  downloaded: boolean; // If the picture exists as a valid file
  width: number;
  height: number;
}
export type anouncementColor = "error" | "info" | "success" | "warning";
export interface announcements {
  leagueID: number;
  priority: anouncementColor;
  title: string;
  description: string;
}

export interface predictions {
  leagueID: number;
  user: number;
  club: string;
  league: string;
  home: number;
  away: number;
}

export interface historicalPredictions {
  matchday: number;
  leagueID: number;
  user: number;
  club: string;
  league: string;
  home: number;
  away: number;
}
