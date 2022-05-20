import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { useState } from "react"

// Shows some simple 
function Player({name, matchdayPoints, points}) {
    return <tr><td>{name}</td><td>{matchdayPoints}</td><td>{points}</td></tr>
}
export default function Home({session, league, standings, historicalPoints}) {
    // Calculates the current matchday
    const currentMatchday = Object.values(historicalPoints)[0].length
    const [matchday, setmatchday] = useState(currentMatchday)
    return (
    <>
    <Head>
      <title>Transfers</title>
    </Head>
    <Menu session={session} league={league}/>
    <h1>Standings</h1>
    <table>
    <tbody>
    <tr><th>Name</th><th>Matchday { matchday} Points</th><th>Total Points</th></tr>
    { standings.map((val) => 
    <Player name={val.player} key={val.player} points={val.points} matchdayPoints={historicalPoints[val.player][matchday-1]}/>
    )}
    </tbody>
    </table>
    <br></br>
    {/* This is to allow the user to input a matchday to show the number of points */}
    <label htmlFor="matchday">Set matchday to show points for</label>
    <input id='matchday' type={"range"} min={1} max={currentMatchday} value={matchday} onChange={(e) => {setmatchday(e.target.value)}}></input>
    </>
  )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    // Gets the leaderboard for the league
    const standings = new Promise((resolve) => {
        const mysql = require("mysql")
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        connection.query("SELECT player, points FROM leagues WHERE leagueId=? ORDER BY points DESC", [ctx.params.league], function(error, results, fields) {
            connection.end()
            resolve(results)
        })
    }).then((val) => JSON.parse(JSON.stringify(val)))
    // Gets the historical amount of points for every matchday in the league
    const historicalPoints = new Promise((resolve) => {
        const mysql = require("mysql")
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        connection.query("SELECT player, points, matchday FROM points WHERE leagueId=? ORDER BY matchday ASC", [ctx.params.league], function(error, results, fields) {
            connection.end()
            if (results.length > 0) {
                let points = {}
                results.forEach(element => {
                    if (points[element.player]) {
                        points[element.player].push(element.points)
                    } else {
                        points[element.player] = [element.points]
                    }
                })
                resolve(points)
            } else {
                resolve({})
            }
        })
    }).then((val) => JSON.parse(JSON.stringify(val)))
    return await redirect(ctx, { standings: await standings, historicalPoints: await historicalPoints })
}