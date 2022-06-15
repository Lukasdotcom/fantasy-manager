import Menu from "../components/Menu"
import Head from "next/head"
export default function Home({session}) {
    return (
    <>
    <Head>
        <title>Info</title>
    </Head>
    <Menu session={session}/>
    <h1>Info</h1>
    <h2>Basics</h2>
    <p>
        First of all this is an open source project that is located on <a style={{"color" : "blue"}} href="https://github.com/Lukasdotcom/Bundesliga" rel="noopener noreferrer" target="_blank">github</a>.
        This project is meant to be an open source version of the fantasy bundesliga soccer manager. If you find a bug or want to request a feature you can add a github issue
    </p>
    <h2>Rules</h2>
    <p>
        Most of the rules are very similar to the official bundesliga fantasy manager. Some changes to the rules include that each player can only be owned by one person in the league and that when 2 people want to buy that same player in the league it goes into a bidding war.
        All transfers are finalized an hour before the official manager&apos;s tranfers period ends to give you some time to setup your team. You are allowed 6 tranfers(a transfer is either a purchase or a sale) and can have unlimited players.
        You start with a budget of 150 million. You are only allowed to move a player onto thee field when the player has not played on that matchday.
    </p>
    </>
    )
}