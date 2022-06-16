import { getSession } from "next-auth/react"
// Used to get information about the redirect for the league runs on every league page
export default async function redirect(ctx, data) {
    const league = ctx.params.league
    const session = await getSession(ctx)
    const mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : process.env.MYSQL_USER,
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
        })
    return await new Promise((resolve) => {
        if (session) {
            // Checks if the user is in the league or not
            connection.query("SELECT * FROM leagues WHERE leagueID=? and user=?", [league, session.user.id], function(error, results, fields) {
                if (results.length > 0) { 
                    resolve({
                        props: {
                            ...data, league: league, leagueName: results[0].leagueName
                        },
                    })
                } else {
                    resolve({
                        notFound : true
                    })
                }
            })
        } else {
            connection.query("SELECT * FROM leagues WHERE leagueID=?", [league], function(error, results, fields) {
                if (results.length > 0) {
                    // Makes sure to redirect a user that is not logged in but went to a valid league to a login
                    resolve({
                        redirect : {
                            destination : `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
                            permanent : false,
                        },
                    })
                } else {
                    resolve({
                        notFound : true
                    })
                }
            })
        }
    }).then((val) => {
        connection.end()
        return val
    })
}