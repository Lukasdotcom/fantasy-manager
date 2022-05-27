import { getSession } from "next-auth/react"

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (session) {
        const mysql = require('mysql')
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        switch (req.method) {
            // Used to create a new league
            case "POST":
                // Generates an id
                const id = Math.floor(Math.random()*2000000)
                // Makes sure that the id is not taken
                await new Promise((resolve) => {connection.query("SELECT leagueID FROM leagues WHERE leagueID=?", [id], function(error, results, fields) {
                    resolve(results)
                })}).then((results) => {
                    if (results.length == 0) {
                        connection.query("INSERT INTO leagues VALUES(?, ?, ?, 0)", [req.body.name, id, session.user.email])
                        res.status(200).end("Created League")
                    } else {
                        throw "Could not create league"
                }}).catch(() => {console.error("Failure in creating league"); res.status(500).end("Error Could not create league")})
                break;
            // Returns all leagues the player is in
            case "GET":
                return res.status(200).json(await leagueList(session.user.email))
            case "DELETE":
                connection.query("DELETE FROM leagues WHERE leagueID=? and player=?", [req.body.id, session.user.email])
                res.status(200).end("Left league")
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
        connection.end()
    } else {
        res.status(401).end("Not logged in")
    }
}
// A Promise that gets all of the leagues a player is in
export async function leagueList(player) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
        })
    return new Promise((resolve) => {connection.query("SELECT leagueName, leagueID FROM leagues WHERE player=?", [player], function(error, results, fields) {
        connection.end()
        resolve(results)
    })})
}