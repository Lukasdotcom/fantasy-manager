// Used to return athe username of a selected user
export default async function handler(req, res) {
    if (req.method == "GET") {
        const mysql = require('mysql')
        const connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        // Gets the id
        const id = req.query.id 
        await new Promise((resolve) => {
            connection.query("SELECT username FROM users WHERE id=?", [id], function(error, result, field) {
                // Checks if the user exists
                if (result.length > 0) {
                    res.status(200).json(result[0].username)
                    resolve()
                } else {
                    res.status(404).end("Player not found")
                    resolve()
                }
            })
        })
        connection.end()
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}