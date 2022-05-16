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
    const data = fetch("https://fantasy.bundesliga.com/api/player_transfers/init", {
        method: 'POST',
        headers:{
            'Content-Type':'application/json',
            'Cookie':`access_token=${process.env.BUNDESLIGA_API}`
        },
        body: JSON.stringify({"payload":{"offerings_query":{"offset":0,"limit":500,"sort":{"order_by":"popularity","order_direction":"desc"}}}})
    }).then(async (val) => {return await val.json()})
    //const data = fetch("http://localhost:3000/data.json").then(async (val) => {return await val.json()})
    connection.query("INSERT IGNORE INTO data VALUES('playerUpdate', ?)", [String(Date.now())])
    // Goes through all of the players and adds their data to the database
    const players = (await data).offerings.items
    players.forEach(async (val) => {
        connection.query("INSERT INTO players VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE value=?, forecast=?, total_points=?, average_points=?, last_match=?", [val.player.uid, val.player.nickname, val.player.team.team_code, val.player.image_urls.default, val.transfer_value, val.player.positions[0], val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points, /*Start of have to update*/val.transfer_value, val.attendance.forecast[0], val.player.statistics.total_points, val.player.statistics.average_points, val.player.statistics.last_match_points])
    })
    console.log("Downloaded new data for today")
    connection.end()
}