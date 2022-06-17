import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
import { SquadPlayer as Player } from "../../components/Player"
import { useState, useEffect } from "react"
import { push } from "@socialgouv/matomo-next"

export default function Home({session, league}) {
    const [squad, setSquad] = useState({"att" : [], "mid" : [], "def" : [], "gk" : [], "bench" : []})
    const [formation, setFormation] = useState([1, 4, 4, 2])
    const [validFormations, setValidFormations] = useState([[1, 4, 4, 2]])
    const field = {"att" : squad.att.length < formation[3], "mid" : squad.mid.length < formation[2], "def" : squad.def.length < formation[1], "gk" : squad.gk.length < formation[0]}
    function getSquad() {
        fetch(`/api/squad/${league}`).then(async (e) => {
            const val = await e.json()
            let players = {"att" : [], "mid" : [], "def" : [], "gk" : [], "bench" : []}
            val.players.forEach((e) => {players[e.position].push(e.playeruid)})
            setFormation(val.formation)
            setSquad(players)
            setValidFormations(val.validFormations)
        })
    }
    // Gets the players squad
    useEffect(getSquad, [league])
    // Checks if the player can change to the formation
    function changeToFormation(newFormation) {
        let defenders = newFormation[1] - squad["def"].length
        let midfielders = newFormation[2] - squad["mid"].length
        let forwards = newFormation[3] - squad["att"].length
        return (!(defenders >= 0) || !(midfielders >= 0) || !(forwards >= 0))
    }
    return (
    <>
    <Head>
        <title>Squad</title>
    </Head>
    <Menu session={session} league={league}/>
    <h1>Squad</h1>
    <label htmlFor="formation">Formation: </label>
    <select onChange={(e) => {
        // Used to change the formation
        let newFormation = JSON.parse(e.target.value)
        push(["trackEvent", "New Formation", JSON.stringify(newFormation)])
        setFormation(newFormation)
        fetch(`/api/squad/${league}`, {
            method : "POST",
            headers:{
                    'Content-Type':'application/json'
                },
            body: JSON.stringify({
                "formation" : newFormation
        })}).then(async (response) => {
            if (!response.ok) {
                alert(await response.text())
            }
        })
    }} value={JSON.stringify(formation)} id='formation'>
    { validFormations.map((val) =>
    <option key={JSON.stringify(val)} disabled={changeToFormation(val)} value={JSON.stringify(val)} >{val[1]}-{val[2]}-{val[3]}</option>
    )}
    </select>
    <h2>Attackers</h2>
    { squad["att"].map((e) => // Used to get the players for the attack
        <Player uid={e} key={e} league={league} update={getSquad} />
    )}
    <h2>Midfielders</h2>
    { squad["mid"].map((e) => // Used to get the players for the mid
        <Player uid={e} key={e} league={league} update={getSquad} />
    )}
    <h2>Defense</h2>
    { squad["def"].map((e) => // Used to get the players for the defense
        <Player uid={e} key={e} league={league} update={getSquad} />
    )}
    <h2>Goalkeeper</h2>
    { squad["gk"].map((e) => // Used to get the player for the goalkeeper
        <Player uid={e} key={e} league={league} update={getSquad} />
    )}
    <h2>Bench</h2>
    { squad["bench"].map((e) => // Used to get the players for the bench
        <Player uid={e} key={e} field={field} league={league} update={getSquad} />
    )}
    </>
    )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    return await redirect(ctx, {})
}