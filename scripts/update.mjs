import fetch from 'node-fetch';
import { createConnection } from 'mysql';
// Used to update all the data
export async function updateData() {
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    const nowTime = parseInt(Date.now()/1000)
    connection.query("INSERT INTO data VALUES('playerUpdate', ?) ON DUPLICATE KEY UPDATE value2=?", [nowTime, nowTime])
    const data = fetch("https://fantasy.bundesliga.com/api/player_transfers/init", {
        method: 'POST',
        headers:{
            'Content-Type':'application/json',
            'Cookie':`access_token=${process.env.BUNDESLIGA_API}`
        },
        body: JSON.stringify({"payload":{"offerings_query":{"offset":0,"limit":1000,"sort":{"order_by":"popularity","order_direction":"desc"}}}})
    }).then(async (val) => {return await val.json()})
    //const data = fetch("http://localhost:3000/data.json").then(async (val) => {return await val.json()})
    // Puts in the data if the transfermarket is open
    const oldTransfer = await new Promise((res) => {
        connection.query("SELECT * FROM data WHERE value1='transferOpen'", function(error, result, field) {
            if (result.length == 0) res(true)
            res(parseInt(result[0].value2) > 0)
        })
    })
    const newTransfer = (await data).opening_hour.countdown > 3600 ? (await data).opening_hour.countdown - 3600 : 0
    connection.query("INSERT INTO data VALUES('transferOpen', ?) ON DUPLICATE KEY UPDATE value2=?", [newTransfer, newTransfer])
     // Goes through all of the players and adds their data to the database
    const players = (await data).offerings.items
    players.forEach(async (val) => {
        connection.query("INSERT INTO players VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE value=?, forecast=?, total_points=?, average_points=?, last_match=?, locked=?", [val.player.uid, val.player.nickname, val.player.team.team_code, val.player.image_urls.default, val.transfer_value, val.player.positions[0], val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points, val.player.is_locked, /*Start of have to update*/val.transfer_value, val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points, val.player.is_locked])
    })
    console.log("Downloaded new data")
    // Checks if the matchday is running 
    if (newTransfer == 0) {
        // Checks if the transfer market has just closed or has been closed for a while
        (oldTransfer > 0) !== (newTransfer > 0) ? startMatchday() : calcPoints()
    }
    connection.end()
}

// Used to start the matchday
export async function startMatchday() {
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    // Goes through every transfer
    await new Promise((res) => {
        connection.query("SELECT * FROM transfers", function(error, result, fields) {
            result.forEach((e) => {
                connection.query("DELETE FROM squad WHERE leagueID=? and playeruid=?", [e.leagueID, e.playeruid])
                if (e.buyer != "") {
                    connection.query("INSERT INTO squad VALUES(?, ?, ?, 'bench')", [e.leagueID, e.buyer, e.playeruid])
                }
            })
            connection.query("DELETE FROM transfers")
            console.log("Ran every transfer")
            res()
        })
    })
    // Sets up the points to 0 for every player in every league and sets up 0 points for that matchday
    connection.query("SELECT leagueID, player, points FROM leagues ORDER BY leagueID", async function(error, result, field) {
        let currentleagueID = -1
        let matchday = Promise.resolve(1)
        // Goes through every league and adds another matchday
        await result.forEach(async (e) => {
            const connection2 = createConnection({
                host     : process.env.MYSQL_HOST,
                user     : "root",
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DATABASE
            })
            if (e.leagueID !== currentleagueID) {
                currentleagueID = e.leagueID
                // Calculates the latest matchday for that league
                matchday = new Promise((res) => {
                    connection2.query("SELECT matchday FROM points WHERE leagueID=? ORDER BY matchday DESC LIMIT 1", [currentleagueID], function(error, result, field) {
                        res(result.length > 0 ? result[0].matchday + 1 : 1)
                    })
                })
            }
            connection2.query("INSERT INTO points VALUES(?, ?, 0, ?)", [e.leagueID, e.player, await matchday])
            connection2.end()
        })
        connection.end()
        calcPoints()
    })
}
// Used to calculate the points for every player
function calcPoints() {
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    connection.query("SELECT leagueID, player, points FROM leagues ORDER BY leagueID", function(error, result, field) {
        result.forEach(async (e) => {
            const connection2 = createConnection({
                host     : process.env.MYSQL_HOST,
                user     : "root",
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DATABASE
            })
            const [oldPoints, newPoints] = await Promise.all([
            // Gets how many points the user had for the matchday with the previous calculation
            new Promise((res) => {
                connection2.query("SELECT points FROM points WHERE leagueID=? and player=? ORDER BY matchday DESC LIMIT 1", [e.leagueID, e.player], function(error, result, field) {
                    res(result[0].points)
                })
            }),
            // Calculates the amont of points the user should have for the matchday
            new Promise((res) => {
                connection2.query("SELECT SUM(last_match) FROM players WHERE EXISTS (SELECT * FROM squad WHERE squad.playeruid=players.uid AND position!='bench' AND leagueID=? AND player=?)", [e.leagueID, e.player], function(error, result, field) {
                    let value = Object.values(result[0])[0]
                    res(value ? value : 0)
                })
            })])
            // Checks if the point calculations are off and if thery are wrong they are updated
            if (oldPoints !== newPoints) {
                connection2.query("UPDATE points SET points=? WHERE leagueID=? AND player=? ORDER BY matchday DESC LIMIT 1", [newPoints, e.leagueID, e.player])
                connection2.query("UPDATE leagues SET points=? WHERE leagueID=? AND player=?", [e.points - oldPoints + newPoints, e.leagueID, e.player])
            }
            connection2.end()
        })
        console.log("Updated player points")
        connection.end()
    })
}
export function checkUpdate() {
    const connection = createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    })
    // Checks if matchdays are currently happening and if it is a matchday checks if the update time has passed
    connection.query("SELECT value2 FROM data WHERE value1='transferOpen' or value1='playerUpdate' ORDER BY value1 DESC", function(error, result, field) {
        if (result[0].value2 == 0 && parseInt(result[1].value2) < parseInt(Date.now()/1000) - parseInt(process.env.MIN_UPDATE_TIME)) {
            connection.query("INSERT INTO data VALUES('update', '1') ON DUPLICATE KEY UPDATE value2=1")
        }
        connection.end()
    })
}