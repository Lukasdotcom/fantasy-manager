import Head from 'next/head'
import { useState } from 'react'
import { getSession, SessionProvider, useSession } from 'next-auth/react'
import { leagueList } from "./api/league"
import Link from 'next/link'
import Menu from "../components/Menu"
import { push } from "@socialgouv/matomo-next"
import {createConnection} from "mysql"
// Used to create a new League
function MakeLeague({getLeagueData}) {
  const [leagueName, setLeagueName] = useState("")
  return (
    <>
    <h2>Create League</h2>
    <input value={leagueName} onChange={(val) => {setLeagueName(val.target.value)}}></input>
    <button onClick={async () => {
      push(["trackEvent",  "League", "Create", leagueName])
      // Used to create a league
      await fetch('/api/league', {
      method : "POST",
      headers:{
              'Content-Type':'application/json'
          },
      body: JSON.stringify({
          "name" : leagueName
      })})
      getLeagueData()}}>Create League</button>
    </>
  )
}
// Used to leave a league
function LeaveLeague({leagueID, getLeagueData}) {
  return (
  <button id={leagueID} onClick={async (e) => {
    push(["trackEvent", "League", "Leave", leagueID])
    await fetch('/api/league', {
      method : "DELETE",
      headers:{
              'Content-Type':'application/json'
          },
      body: JSON.stringify({
          "id" : leagueID
      })})
    getLeagueData()
  }} className='red-button'>Leave League</button>
  )
}
// Used to list all the leagues you are part of and to add a league
function Leagues({leagueData}) {
  const { data: session } = useSession()
  const [legueList, setLeagueList] = useState(leagueData)
  if (session) {
    // Used to get a list of all the leagues
    const getLeagueData = async () => {
      let data = await fetch('/api/league')
      setLeagueList(await data.json())
    }
    return (
      <>
      <h1>Leagues</h1>
      { legueList.map((val) => 
      // Makes a link for every league
      <div key={val.leagueID}>
      <Link href={`/${val.leagueID}`}>{val.leagueName}</Link>
      <LeaveLeague leagueID={val.leagueID} getLeagueData={getLeagueData} />
      </div>
      )}
      <MakeLeague getLeagueData={getLeagueData}/>
      </>
    )
  } else {
    return <></>
  }
  
}
export default function Home({session, leagueData, versionData}) {
  return (
    <>
    <Head>
      <title>Bundesliga Fantasy</title>
    </Head>
    <Menu session={session}/>
    <h1>Bundesliga Fantasy Manager</h1>
    <SessionProvider session={session}>
      <Leagues leagueData={leagueData} />
    </SessionProvider>
    { versionData !== null &&
      <div className={"notification"}>
        <a href={versionData} rel="noreferrer" target="_blank">New Update for more info Click Here</a>
      </div>
    }
    </>
  )
}

export async function getServerSideProps(ctx) {
  const versionData = new Promise((res) => {
    const connection = createConnection({
      host     : process.env.MYSQL_HOST,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
      database : process.env.MYSQL_DATABASE
    })
    connection.query("SELECT value2 FROM data WHERE value1='update'", function(error, result, field) {
      if (result.length === 0) {
        res(null)
      } else {
        res(result[0].value2)
      }
    })
    connection.end()
  })
  const session = getSession(ctx)
  if (await session) {
    return {props : {versionData : await versionData, leagueData : JSON.parse(JSON.stringify(await leagueList((await session).user.id)))}}
  } else {
    return {props : {versionData : await versionData, leagueData : []}}
  }
}