import { createConnection } from 'mysql';
import {updateData} from './update.mjs'
const connection = createConnection({
    host     : process.env.MYSQL_HOST,
    user     : "root",
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
})
let date = new Date
var day = date.getDay()
connection.query("CREATE TABLE IF NOT EXISTS players (uid varchar(25) PRIMARY KEY, name varchar(255), club varchar(3), pictureUrl varchar(255), value int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int)")
// Creates a table that contains some key value pairs for data that is needed for some things
connection.query("CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))")
// Used to store the leagues
connection.query("CREATE TABLE IF NOT EXISTS leagues (leagueName varchar(255), leagueID int, player varchar(255), points int)")
// Makes sure to check for an update every 30 minutes
setInterval(update, 1800000)
updateData()
function update() {
    let newDate = new Date
    // Checks if a new day is happening
    if (day != newDate.getDay()) {
        day = newDate.getDay()
        if (day == 1) {
            endMatchDay()
        }
        updateData()
    }
}
// End the match day and calculates all the points
function endMatchDay() {

}
