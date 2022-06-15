import { createConnection } from 'mysql';
import {updateData} from './update.mjs'
// Used to tell the program what version of the database to use
const currentVersion = "0.1.1"
let date = new Date
var day = date.getDay()

async function startUp() {
    // Waits unitl the sql server is ready
    let error = true
    while (error) {
        error = await new Promise((res) => {
            setTimeout(() => {
                const connection = createConnection({
                    host     : process.env.MYSQL_HOST,
                    user     : "root",
                    password : process.env.MYSQL_PASSWORD,
                    database : process.env.MYSQL_DATABASE
                })
                connection.query("SHOW TABLES", function(error) {
                    res(error)
                })
            }, 500)
        })
    }
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    // Used to store the players data
    connection.query("CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool)")
    // Creates a table that contains some key value pairs for data that is needed for some things
    connection.query("CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))")
    // Used to store the leagues
    connection.query("CREATE TABLE IF NOT EXISTS leagues (leagueName varchar(255), leagueID int, player varchar(255), points int, money int, formation varchar(255))")
    // Used to store the Historical Points
    connection.query("CREATE TABLE IF NOT EXISTS points (leagueID int, player varchar(255), points int, matchday int)")
    // Used to store transfers
    connection.query("CREATE TABLE IF NOT EXISTS transfers (leagueID int, seller varchar(255), buyer varchar(255), playeruid varchar(25), value int)")
    // Used to store invite links
    connection.query("CREATE TABLE IF NOT EXISTS invite (inviteID varchar(25) PRIMARY KEY, leagueID int)")
    // Used to store player squads
    connection.query("CREATE TABLE IF NOT EXISTS squad (leagueID int, player varchar(255), playeruid varchar(25), position varchar(5))")
    // Checks the version of the database is out of date
    await new Promise((res) => {
        connection.query("SELECT value2 FROM data WHERE value1='version'", function(error, result, field) {
            if (result.length > 0) {
                const oldVersion = result[0].value2
                // HERE IS WHERE THE CODE GOES TO UPDATE THE DATABASE FROM ONE VERSION TO THE NEXT
                // Makes sure that the database is up to date
                if (oldVersion !== currentVersion) {
                    console.error("Database is corrupted or is too old")
                }
            }
            // Updated version of database in table
            connection.query("INSERT INTO data VALUES('version', ?) ON DUPLICATE KEY UPDATE value2=?", [currentVersion, currentVersion])
            res()
        })
    })
    // Makes sure to check if an update is neccessary every 10 seconds
    setInterval(update, 10000)
    updateData()
}
startUp()
async function update() {
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    let newDate = new Date
    // Checks if a new day is happening
    if (day != newDate.getDay()) {
        day = newDate.getDay()
        console.log("Downloading new data for today")
        updateData()
    } else if (await new Promise((resolve) => {
        connection.query("SELECT * FROM data WHERE value1='update' and value2='1'", function(error, result, field) {
            resolve(result.length > 0)
        })
    })) {
        console.log("Updating data now")
        updateData()
    } else {
        // Checks how much longer the transfer period is and lowers the value for the transfer period length and if the transfer period is about to end ends it
        connection.query("SELECT value2 FROM data WHERE value1='transferOpen'", function(error, result, field) {
            if (result.length > 0) {
                const time = result[0].value2
                if (time > 0) {
                    if (time - 10 > 0) {
                        connection.query("UPDATE data SET value2=? WHERE value1='transferOpen'", [time-10])
                    } else {
                        console.log("Predicted start of matchday")
                        updateData()
                    }
                }
            }
        })
    }
    connection.query("UPDATE data SET value2='0' WHERE value1='update'")
    connection.end()
}
