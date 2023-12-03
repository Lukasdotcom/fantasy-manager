/* eslint-disable @typescript-eslint/no-explicit-any */
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
    throw Error(
      "Mysql/mariadb support has been dropped since 1.16.0. Please specify a SQLITE path.",
    );
  }
  const connect = await open({
    filename: process.env.SQLITE,
    driver: sqlite3.Database,
  });
  return new connection(connect);
}
class connection {
  private connection: Database<sqlite3.Database, sqlite3.Statement>;
  constructor(connection: Database<sqlite3.Database, sqlite3.Statement>) {
    connection.configure("busyTimeout", 100000);
    this.connection = connection;
  }
  // Used to query a statement
  async query(
    statement: string,
    prepare: unknown[] = [],
    logError = false,
  ): Promise<any[]> {
    const connection = this.connection;
    // Converts some mysql to sqlite syntax
    statement = statement.replace(
      /on duplicate key update/gi,
      "ON CONFLICT DO UPDATE SET",
    );
    statement = statement.replace(/insert ignore/gi, "INSERT OR IGNORE");
    sqlite3.verbose();
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
        statement = statement.replace(/ AUTO_INCREMENT /gi, " AUTOINCREMENT ");
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
  // Used to disconnect from the db
  async end() {
    const connection = this.connection;
    connection.close();
  }
  // Used to optimize the db (VACUUM and optimize for sqlite)
  async optimize() {
    console.log("Optimizing database");
    await this.query("pragma vacuum");
    await this.query("pragma optimize");
    console.log("Optimized database");
  }
}
