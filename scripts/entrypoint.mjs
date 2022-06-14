import { createConnection } from 'mysql';
import {runTransfers, updateData} from './update.mjs'
const connection = createConnection({
    host     : process.env.MYSQL_HOST,
    user     : "root",
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
})
let date = new Date
var day = -1
connection.query("CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool)")
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
// Makes sure to check for an update every 30 minutes
setInterval(update, 10000)
update()
async function update() {
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
    }
    connection.query("UPDATE data SET value2='0' WHERE value1='update'")
}
// End the match day and calculates all the points
function endMatchDay() {

}
