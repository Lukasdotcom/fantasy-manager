/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, createConnection } from "mysql";
import dotenv from "dotenv";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
if (process.env.APP_ENV !== "test") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config({ path: ".env.test.local" });
}
// Creates a connection
export default async function connect() {
  // Checks if sqlite or mysql should be used
  if (process.env.SQLITE === undefined) {
    // Waits unitl the sql server is ready
    let error = true;
    let connect = undefined;
    let counter = 0;
    while (error || connect === undefined) {
      [error, connect] = await new Promise<[boolean, Connection]>((res) => {
        setTimeout(async () => {
          const connect = createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
          });
          const error = await new Promise((res) => {
            connect.connect(function (error) {
              res(error);
            });
          });
          res([!!error, connect]);
        }, 500);
      });
      if (error) {
        counter++;
        console.error("Failed to connect to database");
        connect.end();
        if (counter > 10) throw "Could not connect to database";
      }
    }
    return new connection(connect);
  } else {
    const connect = await open({
      filename: process.env.SQLITE,
      driver: sqlite3.Database,
    });
    return new connection(connect);
  }
}
class connection {
  private connection:
    | Connection
    | Database<sqlite3.Database, sqlite3.Statement>;
  private timeout;
  constructor(
    connection: Connection | Database<sqlite3.Database, sqlite3.Statement>,
  ) {
    const mysql = "end" in connection;
    if (mysql) {
      this.connection = connection;
      // Heartbeat to make sure connection does not drop
      this.timeout = setInterval(() => {
        this.query("SHOW TABLES");
      }, 10000);
    } else {
      connection.configure("busyTimeout", 100000);
      this.connection = connection;
    }
  }
  // Used to query a statement
  async query(
    statement: string,
    prepare: unknown[] = [],
    logError = false,
  ): Promise<any[]> {
    const connection = this.connection;
    const mysql = "query" in connection;
    // Checks if this is mysql or sqlite
    if (mysql) {
      if (logError) console.log(statement);
      return new Promise((res) => {
        connection.query(
          statement,
          prepare,
          function (errors: any, result: any[]) {
            // This is for debugging purposes
            if (logError) {
              console.log(errors);
            }
            res(result);
          },
        );
      });
    } else {
      // Converts all mysql statements to sqlite
      statement = statement.replace(
        /on duplicate key update/gi,
        "ON CONFLICT DO UPDATE SET",
      );
      statement = statement.replace(/insert ignore/gi, "INSERT OR IGNORE");
      if (true) sqlite3.verbose();
      if (statement.slice(0, 6) === "SELECT") {
        if (logError) {
          console.log(statement);
          console.log(prepare);
        }
        const result = await connection.all(statement, prepare);
        return Promise.resolve(result);
      } else {
        if (
          statement.slice(0, 12) === "CREATE TABLE" ||
          statement.slice(0, 11) === "ALTER TABLE"
        ) {
          statement = statement.replace(/ int /gi, " INTEGER ");
          statement = statement.replace(/ varchar\\(.+?\\) /gi, " TEXT ");
          statement = statement.replace(/ bool /gi, " NUMERIC ");
          statement = statement.replace(
            / AUTO_INCREMENT /gi,
            " AUTOINCREMENT ",
          );
        }
        if (logError) {
          console.log(statement);
          console.log(prepare);
        }
        await connection.run(statement, prepare);
        const result: any[] = [];
        return Promise.resolve(result);
      }
    }
  }
  // Used to disconnect from the db
  async end() {
    const connection = this.connection;
    const mysql = "query" in connection;
    if (mysql) {
      clearInterval(this.timeout);
      connection.end();
    } else {
      connection.close();
    }
  }
}
export type position = "bench" | "gk" | "def" | "mid" | "att";
export type forecast = "a" | "u" | "m";
// These are the types for the database
export interface users {
  id: number;
  username: string;
  password: string;
  throttle: number;
  active: boolean;
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
}
export interface leagueUsers {
  leagueID: number;
  user: number;
  points: number;
  money: number;
  formation: string;
  admin: boolean;
  tutorial: boolean;
}
export interface points {
  leagueID: number;
  user: number;
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
  gameStart: number;
  gameEnd: number;
  opponent: string;
  league: string;
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
  url: string;
  version: string;
}
export interface pictures {
  id: number;
  url: string;
  downloaded: boolean;
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
export const validLeagues = async (): Promise<string[]> => {
  const connection = await connect();
  const result = await connection.query(
    "SELECT * FROM plugins WHERE enabled=1",
  );
  return result.map((e) => e.name);
};

export const validLeagueUrls = async (): Promise<string[]> => {
  const connection = await connect();
  const result = await connection.query(
    "SELECT * FROM plugins WHERE enabled=1",
  );
  return result.map((e) => e.url);
};
