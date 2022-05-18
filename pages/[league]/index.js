import { getSession } from "next-auth/react"
import Menu from "../../components/Menu"

export default function Home({session, league}) {
    return (
    <>
    <Menu session={session} league={league}/>
    </>
  )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    const mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : "root",
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
        })
    const session = await getSession(ctx)
    return await new Promise((resolve) => {
        if (session) {
            connection.query("SELECT * FROM leagues WHERE leagueID=? and player=?", [ctx.params.league, session.user.email], function(error, results, fields) {
                if (results.length > 0) {
                    resolve({
                        props: {
                            league: ctx.params.league, leagueName: results[0].leagueName
                        },
                    })
                } else {
                    resolve({
                        notFound : true
                    })
                }
            })
        } else {
            connection.query("SELECT * FROM leagues WHERE leagueID=?", [ctx.params.league], function(error, results, fields) {
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
        return val
    })
}