import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { useState } from "react"

// Shows some simple 
function Player({name, matchdayPoints, points}) {
    return <tr><td>{name}</td><td>{matchdayPoints}</td><td>{points}</td></tr>
}
// Used to show all the invites that exist and to delete an individual invite
function Invite({link, league, host, remove}) { 
    return <p>Link: {`${host}/api/invite/${link}`}<button onClick={async () => {
        await fetch('/api/invite', {
            method: "DELETE",
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                "leagueID" : league,
                "link" : link
        })})
        remove()
    }} className="red-button">Delete</button></p>
}
export default function Home({session, league, standings, historicalPoints, inviteLinks, host}) {
    // Calculates the current matchday
    if (Object.values(historicalPoints).length == 0) {
        var currentMatchday = 0
    } else {
        var currentMatchday = Object.values(historicalPoints)[0].length
    }
    const [matchday, setmatchday] = useState(currentMatchday)
    const [invites, setInvites] = useState(inviteLinks)
    const [newInvite, setnewInvite] = useState("")
    return (
    <>
    <Head>
      <title>Transfers</title>
    </Head>
    <Menu session={session} league={league}/>
    <h1>Standings</h1>
    <table>
    <tbody>
    <tr><th>Player</th><th>Matchday { matchday} Points</th><th>Total Points</th></tr>
    { standings.map((val) => 
    <Player name={val.player} key={val.player} points={val.points} matchdayPoints={matchday != 0 ? historicalPoints[val.player][matchday-1] : 0}/>
    )}
    </tbody>
    </table>
    <br></br>
    {matchday != 0 &&/* This is to allow the user to input a matchday to show the number of points */
    <>
    <label htmlFor="matchday">Set matchday to show points for</label>
    <input id='matchday' type={"range"} min={1} max={currentMatchday} value={matchday} onChange={(e) => {setmatchday(e.target.value)}}></input>
    </>
    }
    <h1>Invite Links</h1>
    { invites.map((val) =>
        <Invite host={host} key={val} link={val} league={league} remove={() => {setInvites(invites.filter((e)=>e!=val))}} />
    )}
    {/* Used to create a new invite link */}
    <label htmlFor="invite">Enter Custom Invite Link Here: </label>
    <input onChange={(val) => {setnewInvite(val.target.value)}} val={newInvite} id="invite"></input>
    <button onClick={() => {
        let link = newInvite
        // Makes sure to generate a random leagueID if none is given
        if (link === "") {
            link = String(Math.random()).slice(2)
        }
        fetch('/api/invite', {
            method: "POST",
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                "leagueID" : league,
                "link" : link
        })}).then((response) => {
            if (response.ok) {
                setInvites([...invites, link])
            } else {
                alert("Invite link already used")
            }
        })
    }}>Add Invite</button>
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
            // Reformats the result into a dictionary that has an entry for each player and each entry for that player is an array of all the points the players earned in chronological order.
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
    const inviteLinks = new Promise((resolve) => {
        // Gets an array of invite links for this league
        const mysql = require("mysql")
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        connection.query("SELECT inviteID FROM invite WHERE leagueId=?", [ctx.params.league], function(error, results, fields) {
            connection.end()
            // Turns the result into a list of valid invite links
            let inviteLinks = []
            results.forEach((val) => {
                inviteLinks.push(val.inviteID)
            })
            resolve(inviteLinks)
        })
    }).then((val) => JSON.parse(JSON.stringify(val)))
    return await redirect(ctx, { standings: await standings, historicalPoints: await historicalPoints, inviteLinks: await inviteLinks, host: ctx.req.headers.host })
}