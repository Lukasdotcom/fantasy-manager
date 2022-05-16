import Head from 'next/head'
import { useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
function MakeLeague() {
  const [leagueName, setLeagueName] = useState("")
  const { data: session } = useSession()
    if (session) {
        return (
          <>
          <h2>Create League</h2>
          <input value={leagueName} onChange={(val) => {setLeagueName(val.target.value)}}></input>
          <button onClick={() => {fetch('/api/league', {
            method : "POST",
            headers:{
                    'Content-Type':'application/json'
                },
            body: JSON.stringify({
                "name" : leagueName
            })})}}>Create League</button>
          </>
        )
    } else {
        return (
            <></>
        )
    }
}
export default function Home({session}) {
  return (
    <>
    <Head>
      <title>Bundesliga Fantasy</title>
    </Head>
    <h1>Bundesliga Fantasy Manager</h1>
    <SessionProvider session={session}>
      <MakeLeague />
    </SessionProvider>
    </>
  )
}
