import { getSession } from "next-auth/react"

export default async function handler(req, res) {
    const session = await getSession({ req })
    const mysql = require('mysql')
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : process.env.MYSQL_USER,
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
    if (session) {
        switch (req.method) {
            case "POST": // Used to create a new invite link
                await new Promise((resolve) => {
                    // Makes sure that user is in the league they claim they are from
                    connection.query("SELECT * FROM leagues WHERE leagueID=? and user=?", [req.body.leagueID, session.user.id], function(error, results, fields) {
                        if (results.length > 0) {
                            connection.query("INSERT INTO invite VALUES(?, ?)", [req.body.link, req.body.leagueID], function(error, result, fields) {
                                // Makes sure to check if any errors happened
                                if (error === null) {
                                    resolve([200, "Created Invite Link"])
                                } else {
                                    resolve([500, "Invite id already used"])
                                }
                            })
                        } else {
                            resolve([403, "You are not in this league"])
                        }
                    })
                }).then((val) => {res.status(val[0]).end(val[1])})
                break;
            case 'GET': // Used to get a list of invite links for a league
                await new Promise(() => {
                    connection.query("SELECT * FROM leagues WHERE leagueID=? and user=?", [req.query.leagueID, session.user.id], function(error, results, fields) {
                        if (results.length > 0) {
                            connection.query("SELECT * FROM invite WHERE leagueID=?", [req.query.leagueID], function(error, results, fields) {
                                res.status(200).json(results)
                            })
                        } else {
                            res.status(403).end("You are not in this league")
                        }
                    })
                })
                break;
            case "DELETE":
                await new Promise(() => {
                    connection.query("SELECT * FROM leagues WHERE leagueID=? and user=?", [req.body.leagueID, session.user.id], function(error, results, fields) {
                        if (results.length > 0) {
                            connection.query("DELETE FROM invite WHERE leagueID=? and inviteID=?", [req.body.leagueID, req.body.link])
                            res.status(200).end("Deleted invite link")
                        } else {
                            res.status(403).end("You are not in this league")
                        }
                    })
                })
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