import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { useState, useEffect } from "react"
import {TransferPlayer as Player} from "../../components/Player"

// Used for the selecting and unselecting of a position
function Postion({position, positions, setPositions}) {
    return (
    <>
        <label htmlFor={position}> {position}:</label>
        <input type="checkbox" onChange={(e) => {e.target.checked ? setPositions([...positions, position]) : setPositions(positions.filter((e2) => e2 != position))}} checked={positions.includes(position)} id={position}></input>
    </>)
}
export default function Home({session, league}) {
    const positionList = ["gk", "def", "mid", "att"]
    const [players, setPlayers] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [finished, setFinished] = useState(false)
    const [positions, setPositions] = useState(positionList)
    const [money, setMoney] = useState(0)
    const [ownership, setOwnership] = useState({})
    const [transferCount, setTransferCount] = useState(0)
    const [orderBy, setOrderBy] = useState("value")
    const [showHidden, setShowHidden] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {search(true)}, [searchTerm, positions, orderBy, showHidden])
    // Used to get the data for a list of transfers and money
    function transferData() {
        fetch(`/api/transfer/${league}`).then(async (val) => {val = await val.json(); setMoney(val.money); setOwnership(val.ownership); setTransferCount(val.transferCount); setTimeLeft(val.timeLeft)})
    }
    // Used to lower the time left by one every second
    useEffect(() => {
        const id = setInterval(() => setTimeLeft((timeLeft) => timeLeft > 0 ? timeLeft - 1 : 0), 1000)
        return () => {
            clearInterval(id);
        }
    }, [])
    // Used to calculate transfer message
    let transferMessage = <p>Transfer Market Closed</p>
    if (timeLeft > 0) {
        transferMessage = <p>Transfer Market open for {Math.floor(timeLeft/3600)} H {Math.floor(timeLeft/60)%60} M {timeLeft % 60} S</p>
    }
    useEffect(transferData, [league])
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
        const newLength = await fetch(`/api/player?${(isNew ? "" : `limit=${players.length + 10}` )}&searchTerm=${encodeURIComponent(searchTerm)}&positions=${encodeURIComponent(JSON.stringify(positions))}&order_by=${orderBy}${showHidden ? "&showHidden=true" : ""}`).then(async (val) => {
            val = await val.json()
            setPlayers(val)
            return val.length
        })
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
    <p>{6-transferCount} transfers left</p>
    <p>Money left: {money / 1000000}M</p>
    { transferMessage }
    <label htmlFor="search">Search Player Name: </label>
    <input onChange={(val) => {setSearchTerm(val.target.value)}} val={searchTerm} id="search"></input>
    <br></br>
    <label htmlFor="order">Order search by:</label>
    <select value={orderBy} onChange={(val) => setOrderBy(val.target.value)} id="order">
        { ["value", "total_points", "average_points", "last_match"].map((val) =>
        <option key={val}>{val}</option>
        )}
    </select>
    <br></br>
    <p>Positions to search: 
    { positionList.map((position) => 
        <Postion key={position} position={position} positions={positions} setPositions={setPositions}/>
    )}
    </p>
    <p>
        <label htmlFor="showHidden"> Show Hidden Players(These players will all probably not earn points):</label>
        <input type="checkbox" onChange={(e) => {setShowHidden(e.target.checked)}} checked={showHidden} id="showHidden"></input>
    </p>
    <p>Yellow background means attendance unknown, red background that the player is not attending, and pink that the player will not earn points anytime soon(Sell these players).</p>
    { players.map((val) =>
        <Player key={val} uid={val} ownership={ownership[val]} money={money} league={league} transferLeft={transferCount<6} transferData={transferData} timeLeft={timeLeft} />
    )}
    </div>
    </>
    )
}

export async function getServerSideProps(ctx) {
    return await redirect(ctx, {})
}