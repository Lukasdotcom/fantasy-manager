import playerStyles from "../styles/Player.module.css"
import { useEffect, useState } from "react"
import Image from 'next/image'
// Used to create the layout for a player card that shows some simple details on a player
const Layout = ({uid, ownership, money, league, transferData}) => {
    const [data, setData] = useState({})
    // Used to get the data for the player 
    useEffect(() => {
        async function getData() {
            setData(await (await fetch(`/api/player/${uid}`)).json())
        }
        getData()
    }, [uid])
    var background = "black"
    if (Object.keys(data).length > 0) {
        // Changes the background to the correct color if the player is missing or not known if they are coming
        if (data.forecast == "u") {
            background = "rgb(50, 50, 0)"
        } else if (data.forecast == "m") {
            background = "rgb(50, 0, 0)"
        }
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
        // Checks if the player has some transfer data
        if (ownership !== undefined) {
            if (ownership.transfer !== undefined) { // Checks if a transfer is on the player
                if (ownership.transfer.self === true) {
                    if (money >= 100000) {
                        PurchaseButton = <button onClick={buySell}>Increase bid from {ownership.transfer.value/1000000} M to {Math.floor(ownership.transfer.value/100000+1)/10} M</button>
                    } else {
                        PurchaseButton = <p>Buying player for {ownership.transfer.value/1000000} M</p>
                    }
                } else {
                    purchaseAmount = ownership.transfer.value + 100000
                    outbidPlayer = ownership.transfer.player
                }
            } else if (ownership.playerSquad === true) { // Checks if the player owns the player
                PurchaseButton = <button onClick={buySell}>Sell for: {purchaseAmount/1000000} M</button>
            } else if (ownership.otherSquad !== undefined) { // Checks if a different player has the player
                PurchaseButton = <button className="disabled-button">Owned by {ownership.otherSquad}</button>
            }
        }
        // Checks if purchaseable and if so checks if the plyer has enough money
        if (PurchaseButton === "") {
            if (purchaseAmount > money) {
                PurchaseButton = <button className="disabled-button">You need: {purchaseAmount/1000000} M {outbidPlayer != "" ? "to outbid " + outbidPlayer : ""}</button>
            } else {
                PurchaseButton = <button onClick={buySell}>{outbidPlayer != "" ? "Outbid " + outbidPlayer : "Buy"} for: {purchaseAmount/1000000} M</button>
            }
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
                    </div>
                </div>
                <div style={{"width" : "15%", "textAlign" : "center"}}>
                {PurchaseButton}
                </div>
            </div>
            )
    } else {
        return <div className={playerStyles.container}><p>loading...</p></div>
    }
}

export default Layout