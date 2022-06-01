import playerStyles from "../styles/Player.module.css"
import { useEffect, useState } from "react"
import Image from 'next/image'
// Used to create the layout for a player card that shows some simple details on a player
const Layout = ({uid}) => {
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
                <p style={{"width" : "15%", "textAlign" : "center"}}>Value: {data.value/1000000} M</p>
            </div>
            )
    } else {
        return <div className={playerStyles.container}><p>loading...</p></div>
    }
}

export default Layout