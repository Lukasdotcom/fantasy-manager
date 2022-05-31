// Used to return a list of UIDs of players that are searched for
export default async function handler(req, res) {
    if (req.method == "GET") {
        const mysql = require('mysql')
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        // Gets the search term
        let searchTerm = req.query.searchTerm != undefined ? req.query.searchTerm : ""
        searchTerm = `%${searchTerm}%`
        // Used to get the number of players to max out the search results to
        let limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10
        // Creates the sql for all the positions
        let positions = ["att", "mid", "def", "gk"]
        if (req.query.positions != undefined) {
            positions = JSON.parse(req.query.positions).forEach != undefined ? JSON.parse(req.query.positions) : positions
        }
        let positionsSQL = ""
        positions.forEach((e) => {
            if (["att", "mid", "def", "gk"].includes(e)) {
                positionsSQL += `position='${e}' OR `
            }
        })
        if (positionsSQL != "") {
            positionsSQL = `AND (${positionsSQL.slice(0, -4)})`
        }
        // Gets the value to order by
        let order_by = ["value", "total_points", "average_points", "last_match"].includes(req.query.order_by) ? req.query.order_by : "value"
        res.status(200).json(await new Promise((resolve) => {
            connection.query(`SELECT uid FROM players WHERE name like ? ${positionsSQL} ORDER BY ${order_by} DESC LIMIT ${limit}`, [searchTerm], function(error, result, fields) {
                resolve(result)
            })
        // Organizes the data in a list instead of a list of dictionaries
        }).then((e) => {
            return e.map((val) => val.uid)
        }))
        connection.end()
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}