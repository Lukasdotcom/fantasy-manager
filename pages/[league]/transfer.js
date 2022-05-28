import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { useState } from "react"
import Player from "../../components/Player"
export default function Home({session, league, defaultSearch}) {
    const [players, setPlayers] = useState(defaultSearch)
    return (
    <>
    <Head>
        <title>Transfers</title>
    </Head>
    <Menu session={session} league={league}/>
    { players.map((val) => 
        <Player key={val} uid={val} />
    )}
    </>
    )
}

export async function getServerSideProps(ctx) {
    const players = fetch("http://localhost:3000/api/player").then(async (val) => await val.json())
    return await redirect(ctx, {defaultSearch : await players})
}