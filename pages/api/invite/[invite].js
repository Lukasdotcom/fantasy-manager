import { getSession } from "next-auth/react"
// Used to join a league
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
        // Checks if it is a valid invite
        await new Promise((resolve) => {
            connection.query("SELECT leagueID FROM invite WHERE inviteID=?", [req.query.invite], function(error, result, fields) {
                if (result.length > 0) {
                    result = result[0]
                    // Gets the info for the league
                    connection.query("SELECT * FROM leagues WHERE leagueID=?", [result.leagueID], function(error, result2, fields) {
                        if (result2.length > 0) {
                            let leagueName = result2[0].leagueName
                            // Checks if the player has already joined the league
                            let joined = false
                            result2.forEach(e => {
                                if (e.player == session.user.email) {
                                    joined = true
                                }
                            })
                            // Adds the player in the database if they have not joined yet
                            if (! joined) {
                                connection.query("INSERT INTO leagues VALUES(?, ?, ?, 0, 150000000, '[1, 4, 4, 2]')", [leagueName, result.leagueID, session.user.email])
                                // Makes sure to add 0 points for every matchday that has already happened.
                                connection.query("SELECT * FROM points WHERE leagueID=? ORDER BY points DESC LIMIT 1", [result.leagueID], function(error, point, fields) {
                                    let matchday = 0
                                    if (point.length > 0) {
                                        matchday = point[0].matchday
                                    }
                                    while (matchday > 0) {
                                        connection.query("INSERT INTO points VALUES(?, ?, 0, ?)", [result.leagueID, session.user.email, matchday])
                                        matchday --
                                    }
                                    resolve()
                                })
                            } else {
                                resolve()
                            }
                            res.redirect(308, `/${result.leagueID}`).end()
                        } else {
                            console.error("Error occured with invite link")
                            res.status(500).end("An error occured please contact the website administrator")
                            resolve()
                        }
                    })
                } else {
                    res.redirect(308, '/404').end()
                    resolve()
                }
            })
        })
        connection.end()
    } else {
        // Redirects the user if they are not logged in
        res.redirect(307, `/api/auth/signin?callbackUrl=${encodeURIComponent(process.env.NEXTAUTH_URL + "/api/invite/" + req.query.invite)}`).end()
    }
}