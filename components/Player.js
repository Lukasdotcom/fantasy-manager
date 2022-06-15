import playerStyles from "../styles/Player.module.css"
import { useEffect, useState } from "react"
import Image from 'next/image'
// Used to create the layout for a player card that shows some simple details on a player just requires the data of the player to be passed into it
export function Player({data, children}) {
    var background = "black"
    if (Object.keys(data).length > 0) {
        // Changes the background to the correct color if the player is missing or not known if they are coming
        if (data.forecast == "u") {
            background = "rgb(50, 50, 0)"
        } else if (data.forecast == "m") {
            background = "rgb(50, 0, 0)"
        }
        return (
            <div className={playerStyles.container} style={{background}}>
                <div style={{"width" : "min(10%, 80px)", "textAlign" : "center"}}><p>{data.club}</p><p>{data.position}</p></div>
                <Image alt='' src={data.pictureUrl} width="130px" height="130px"/>
                <div style={{"width" : "70%"}}>
                    <p>{data.name}</p>
                    <div className={playerStyles.innerContainer}>
                        <div>
                            <p>Total</p>
                            <p>{data.total_points}</p>
                        </div>
                        <div>
                            <p>Average</p>
                            <p>{data.average_points}</p>
                        </div>
                        <div>
                            <p>Last Match</p>
                            <p>{data.last_match}</p>
                        </div>
                        <div>
                            <p>Value</p>
                            <p>{data.value/1000000} M</p>
                        </div>
                    </div>
                </div>
                { children }
            </div>
            )
    } else {
        return <div className={playerStyles.container}><p>loading...</p></div>
    }
}
// Used for the transfer screen
export function TransferPlayer({uid, ownership, money, league, transferData, transferLeft, timeLeft}) {
    const [data, setData] = useState({})
    // Used to get the data for the player 
    useEffect(() => {
        async function getData() {
            setData(await (await fetch(`/api/player/${uid}`)).json())
        }
        getData()
    }, [uid])
    // Used to purchase a player
    function buySell() {
        fetch(`/api/transfer/${league}`, {
            method : "POST",
            headers:{
                    'Content-Type':'application/json'
                },
            body: JSON.stringify({
                "playeruid" : uid
        })}).then(async (response) => {
            if (!response.ok) {
                alert(await response.text())
            }
            transferData()
        })
    }
    let PurchaseButton = ""
    let purchaseAmount = data.value 
    let outbidPlayer = ""
    // Checks if the transfer market is open
    if (timeLeft === 0) {
        PurchaseButton = <button disabled={true}>Transfer Market is closed</button>
    }
    // Checks if the player has some transfer data
    if (ownership !== undefined && PurchaseButton === "") {
        if (ownership.transfer !== undefined) { // Checks if a transfer is on the player
            if (ownership.transfer.buyerSelf === true) {
                if (money >= 100000) {
                    PurchaseButton = <button onClick={buySell}>Increase bid from {ownership.transfer.value/1000000} M to {Math.floor(ownership.transfer.value/100000+1)/10} M</button>
                } else {
                    PurchaseButton = <button disabled={true}>Buying player for {ownership.transfer.value/1000000} M</button>
                }
            } else if (ownership.transfer.sellerSelf === true) {
                PurchaseButton = <button disabled={true}>Selling player for {ownership.transfer.value/1000000} M</button>
            } else {
                purchaseAmount = ownership.transfer.value + 100000
                outbidPlayer = ownership.transfer.buyer
            }
        } else if (ownership.playerSquad === true) { // Checks if the player owns the player
            if (transferLeft) {
                PurchaseButton = <button onClick={buySell}>Sell for: {purchaseAmount/1000000} M</button>
            } else {
                PurchaseButton = <button disabled={true}>No transfer left can&apos;t sell</button>
            }
        } else if (ownership.otherSquad !== undefined) { // Checks if a different player has the player
            PurchaseButton = <button disabled={true}>Owned by {ownership.otherSquad}</button>
        }
    }
    // Checks if purchaseable and if so checks if the plyer has enough money
    if (PurchaseButton === "") {
        if (purchaseAmount > money) {
            PurchaseButton = <button disabled={true}>You need: {purchaseAmount/1000000} M {outbidPlayer != "" ? "to outbid " + outbidPlayer : ""}</button>
        } else {
            PurchaseButton = <button onClick={buySell}>{outbidPlayer != "" ? "Outbid " + outbidPlayer : "Buy"} for: {purchaseAmount/1000000} M</button>
        }
        if (!transferLeft) {
            PurchaseButton = <button disabled={true}>No transfer left can&apos;t buy</button>
        }
    }
    return (
        <Player data={data}>
            <div style={{"width" : "min(30%, 230px)", "textAlign" : "center"}}>
            {PurchaseButton}
            </div>
        </Player>
        )
}
// Used for the squad. Field should be undefined unless they are on the bench and then it shoud give what positions are still open
export function SquadPlayer({uid, update, field, league}) {
    const [data, setData] = useState({})
    // Used to get the data for the player 
    useEffect(() => {
        async function getData() {
            setData(await (await fetch(`/api/player/${uid}`)).json())
        }
        getData()
    }, [uid])
    // Checks if the player is on the bench or not
    var MoveButton = ""
    var disabled = false
    if (field === undefined) {
        MoveButton = "Move to Bench"
    } else {
        disabled = !field[data.position]
        MoveButton = !disabled ? "Move to Field" : "Remove player from position to move this player onto field"
        if (data.locked) {
            disabled = true
            MoveButton = "Player has already played"
        }
    }
    return (
        <Player data={data}>
            <button onClick={() => {
                // Used to move the player
                fetch(`/api/squad/${league}`, {
                    method : "POST",
                    headers:{
                            'Content-Type':'application/json'
                        },
                    body: JSON.stringify({
                        "playerMove" : [uid]
                })}).then(async (response) => {
                    if (!response.ok) {
                        alert(await response.text())
                    }
                }).then(update)
            }}disabled={disabled}>{MoveButton}</button>
        </Player>
        )
}