import { createConnection } from "mysql";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// Creates a connection
export default async function connect() {
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
  return new connection(connect);
}
// Used to connect to the database
class connection {
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
