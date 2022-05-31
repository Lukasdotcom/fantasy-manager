import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { useState, useEffect } from "react"
import Player from "../../components/Player"
export default function Home({session, league, defaultSearch}) {
    const positionList = ["gk", "def", "mid", "att"]
    const [players, setPlayers] = useState(defaultSearch)
    const [searchTerm, setSearchTerm] = useState("")
    const [finished, setFinished] = useState(false)
    const [positions, setPositions] = useState(positionList)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {search(true)}, [searchTerm, positions])
    // Used to search the isNew is used to check if it should reload everything back from the start
    async function search(isNew) {
        var length = -1
        if (!isNew) {
            if (finished) {
                return
            } else {
                length = players.length
            }
        } else {
            setFinished(false)
        }
        // Gets the data and returns the amount of players found
        const newLength = await fetch(`/api/player?${(isNew ? "" : `limit=${players.length + 10}` )}&searchTerm=${encodeURIComponent(searchTerm)}&positions=${encodeURIComponent(JSON.stringify(positions))}`).then(async (val) => {val = await val.json(); setPlayers(val); return val.length})
        if (newLength == length) {
            setFinished(true)
        }
    }
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
            search(false)
        }
    }}>
    <label htmlFor="search">Search Player Name: </label>
    <input onChange={(val) => {setSearchTerm(val.target.value)}} val={searchTerm} id="search"></input>
    <br></br>
    { positionList.map((position) => 
        // Used to select and unselect every position
        <>
        <label htmlFor={position}>{position}:</label>
        <input type="checkbox" onChange={(e) => {e.target.checked ? setPositions([...positions, position]) : setPositions(positions.filter((e2) => e2 != position))}} checked={positions.includes(position)} id={position}></input>
        </>
    )}
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