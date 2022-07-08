import { getSession } from "next-auth/react"

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (session) {
        const mysql = require('mysql')
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : process.env.MYSQL_USER,
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        switch (req.method) {
            // Used to create a new league
            case "POST":
                // Generates an id
                const id = Math.floor(Math.random()*2000000)
                // Makes sure that the id is not taken
                await new Promise((resolve) => {
                    connection.query("SELECT leagueID FROM leagueSettings WHERE leagueID=?", [id], function(error, results, fields) {
                        if (results.length == 0) {
                            connection.query("INSERT INTO leagueSettings (leagueName, leagueID) VALUES (?, ?)", [req.body.name, id])
                            connection.query("INSERT INTO leagueUsers (leagueID, user, points, money, formation) VALUES(?, ?, 0, 150000000, '[1, 4, 4, 2]')", [id, session.user.id])
                            // Checks if the game is in a transfer period and if yes it starts the first matchday automatically
                            connection.query("SELECT value2 FROM data WHERE value1='transferOpen'", function(error, result, field) {
                                if (parseInt(result[0].value2) == 0) {
                                    connection.query("INSERT INTO points (leagueID, user, points, matchday) VALUES(?, ?, 0, 1)" , [id, session.user.id])
                                }
                                res.status(200).end("Created League")
                                console.log(`User ${id} created league of ${id} with name ${req.body.name}`)
                                resolve()
                            })
                        } else {
                            throw "Could not create league"
                        }
                    })
                }).catch(() => {console.error("Failure in creating league"); res.status(500).end("Error Could not create league")})
                break;
            case "GET": // Returns all leagues the user is in
                res.status(200).json(await leagueList(session.user.id))
                break;
            case "DELETE":
                // Used to leave a league
                connection.query("DELETE FROM leagueUsers WHERE leagueID=? and user=?", [req.body.id, session.user.id])
                connection.query("DELETE FROM points WHERE leagueID=? and user=?", [req.body.id, session.user.id])
                connection.query("DELETE FROM squad WHERE leagueID=? and user=?", [req.body.id, session.user.id])
                connection.query("UPDATE transfers SET seller='' WHERE leagueID=? and seller=?", [req.body.id, session.user.id])
                connection.query("UPDATE transfers SET buyer='' WHERE leagueID=? and buyer=?", [req.body.id, session.user.id])
                console.log(`User ${session.user.id} left league ${req.body.id}`)
                // Checks if the league still has users
                connection.query("SELECT * FROM leagueUsers WHERE leagueID=?", [req.body.id], function(error, result, field) {
                    const connection2 = mysql.createConnection({
                        host     : process.env.MYSQL_HOST,
                        user     : process.env.MYSQL_USER,
                        password : process.env.MYSQL_PASSWORD,
                        database : process.env.MYSQL_DATABASE
                    })
                    if (result.length == 0) {
                        connection2.query("DELETE FROM invite WHERE leagueID=?", [req.body.id])
                        connection2.query("DELETE FROM transfers WHERE leagueID=?", [req.body.id])
                        connection2.query("DELETE FROM leagueSettings WHERE leagueId=?", [req.body.id])
                        connection2.end()
                        console.log(`League ${req.body.id} is now empty and is being deleted`)
                    }
                })
                res.status(200).end("Left league")
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
        connection.end()
    } else {
        res.status(401).end("Not logged in")
    }
}
// A Promise that gets all of the leagues a user is in
export async function leagueList(user) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : process.env.MYSQL_USER,
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
        })
    return new Promise((resolve) => {connection.query("SELECT leagueName, leagueID FROM leagueSettings WHERE EXISTS (SELECT * FROM leagueUsers WHERE user=? and leagueUsers.leagueID = leagueSettings.leagueID)", [user], function(error, results, fields) {
        connection.end()
        resolve(results)
    })})
}