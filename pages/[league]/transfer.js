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
    <div className="main-content" onScroll={async (e) => {
        // Checks if scrolled to the bottom
        const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight
        // Checks if there are only 2 players left that are not shown and if true requests 10 more players
        if (bottom < e.target.scrollHeight/players.length * 2) {
            fetch(`/api/player?limit=${players.length + 10}`).then(async (val) => setPlayers(await val.json()))
        }
    }}>
    { players.map((val) => 
        <Player key={val} uid={val} />
    )}
    </div>
    </>
    )
}

export async function getServerSideProps(ctx) {
    const players = fetch("http://localhost:3000/api/player").then(async (val) => await val.json())
    return await redirect(ctx, {defaultSearch : await players})
}