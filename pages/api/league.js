import { getSession } from "next-auth/react"

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (req.method == "POST") { 
        if (session) {
            var mysql = require('mysql')
            var connection = mysql.createConnection({
                host     : process.env.MYSQL_HOST,
                user     : "root",
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DATABASE
                })
            // Used to generate the id for the league
            const id = Math.floor(Math.random()*2000000)
            await new Promise((resolve) => {connection.query("SELECT leagueID FROM leagues WHERE leagueID=?", [id], function(error, results, fields) {
                resolve(results)
            })}).then((results) => {
            console.log(results)
                if (results.length == 0) {
                    console.log(id)
                    connection.query("INSERT INTO leagues VALUES(?, ?, ?, 0)", [req.body.name, id, session.user.email])
                    res.status(200).end("Created League")
                } else {
                    throw "Could not create league"
            }}).catch(() => {res.status(500).end("Could not create league")})
        } else {
            res.status(401).end("Not logged in")
        }
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}