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
    /*const data = fetch("https://fantasy.bundesliga.com/api/player_transfers/init", {
        method: 'POST',
        headers:{
            'Content-Type':'application/json',
            'Cookie':`access_token=${process.env.BUNDESLIGA_API}`
        },
        body: JSON.stringify({"payload":{"offerings_query":{"offset":0,"limit":500,"sort":{"order_by":"popularity","order_direction":"desc"}}}})
    }).then(async (val) => {return await val.json()})*/
    const data = fetch("http://localhost:3000/data.json").then(async (val) => {return await val.json()})
    connection.query("INSERT INTO data VALUES('playerUpdate', ?) ON DUPLICATE KEY UPDATE value2=?", [String(Date.now()), String(Date.now())])
    // Puts in the data if the transfermarket is open
    connection.query("INSERT INTO data VALUES('transferOpen', ?) ON DUPLICATE KEY UPDATE value2=?", [(await data).opening_hour.opened, (await data).opening_hour.opened])
    // Goes through all of the players and adds their data to the database
    const players = (await data).offerings.items
    players.forEach(async (val) => {
        connection.query("INSERT INTO players VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE value=?, forecast=?, total_points=?, average_points=?, last_match=?, locked=?", [val.player.uid, val.player.nickname, val.player.team.team_code, val.player.image_urls.default, val.transfer_value, val.player.positions[0], val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points, val.player.is_locked, /*Start of have to update*/val.transfer_value, val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points, val.player.is_locked])
    })
    console.log("Downloaded new data for today")
    connection.end()
}