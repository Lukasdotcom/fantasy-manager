import Head from 'next/head'
import { useState } from 'react'
import { getSession, SessionProvider, useSession } from 'next-auth/react'
import { leagueList } from "./api/league"
import Link from 'next/link'
import Menu from "../components/Menu"
// Used to create a new League
function MakeLeague({getLeagueData}) {
  const [leagueName, setLeagueName] = useState("")
  return (
    <>
    <h2>Create League</h2>
    <input value={leagueName} onChange={(val) => {setLeagueName(val.target.value)}}></input>
    <button onClick={async () => {
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
export default function Home({session, leagueData}) {
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
    </>
  )
}

export async function getServerSideProps(ctx) {
  const session = getSession(ctx)
  if (await session) {
    return {props : {leagueData : JSON.parse(JSON.stringify(await leagueList((await session).user.id)))}}
  } else {
    return {props : {leagueData : []}}
  }
}