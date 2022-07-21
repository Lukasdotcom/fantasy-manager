import { createConnection } from "mysql";
import dotenv from "dotenv";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
dotenv.config({ path: ".env.local" });
// Creates a connection
export default async function connect() {
  // Checks if sqlite or mysql should be used
  if (process.env.SQLITE === undefined) {
    // Waits unitl the sql server is ready
    let error = true;
    let connect = undefined;
    let counter = 0;
    while (error) {
      [error, connect] = await new Promise((res) => {
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
          res([error, connect]);
        }, 500);
      });
      if (error) {
        counter++;
        console.log("Failed to connect to database");
        connect.end();
        if (counter > 10) throw "Could not connect to database";
      }
    }
    return new connectionMysql(connect);
  } else {
    const connect = await open({
      filename: process.env.SQLITE,
      driver: sqlite3.Database,
    });
    return new connectionSqlite(connect);
  }
}
// Used to connect to the database
class connectionMysql {
  // Used to create a connection
  constructor(connection) {
    this.connection = connection;
    // Heartbeat to make sure connection does not drop
    this.timeout = setInterval(() => {
      this.query("SHOW TABLES");
    }, 10000);
  }
  // Used to query a statement
  async query(statement, prepare = [], logError = false) {
    if (logError) console.log(statement);
    return new Promise((res) => {
      this.connection.query(
        statement,
        prepare,
        function (errors, result, field) {
          // This is for debugging purposes
          if (logError) {
            console.log(errors);
          }
          res(result);
        }
      );
    });
  }
  // Used to close a connection
  async end() {
    clearInterval(this.timeout);
    this.connection.end();
  }
}
class connectionSqlite {
  constructor(connection) {
    this.connection = connection;
  }
  async query(statement, prepare = [], logError = false) {
    // Converts all mysql statements to sqlite
    statement = statement.replace(
      /on duplicate key update/gi,
      "ON CONFLICT DO UPDATE SET"
    );
    if (statement.slice(0, 12) === "CREATE TABLE")
      statement = statement.replace(/ int /gi, " INTEGER ");
    statement = statement.replace(/ varchar\\(.+?\\) /gi, " TEXT ");
    statement = statement.replace(/ bool /gi, " NUMERIC ");
    statement = statement.replace(/ AUTO_INCREMENT /gi, " AUTOINCREMENT ");
    if (logError) console.log(statement);
    if (true) sqlite3.verbose();
    if (statement.slice(0, 6) === "SELECT") {
      const result = await this.connection.all(statement, prepare);
      return Promise.resolve(result);
    } else {
      await this.connection.run(statement, prepare);
      return Promise.resolve(undefined);
    }
  }
  async end() {
    this.connection.close();
  }
}
