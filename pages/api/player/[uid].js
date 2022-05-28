// Used to return a dictionary on the data for a player
export default async function handler(req, res) {
    if (req.method == "GET") {
        const mysql = require('mysql')
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        const result = await new Promise((resolve) => {
            connection.query(`SELECT * FROM players WHERE uid=? LIMIT 1`, [req.query.uid], function(error, result, fields) {
                resolve(result)
            })
        }).then((e) => e)
        // Checks if 
        if (result.length > 0) {
            res.status(200).json(result[0])
        } else {
            res.status(404).end("Player not found")
        }
        connection.end()
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}