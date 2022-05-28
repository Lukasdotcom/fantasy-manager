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
    if (Object.keys(data).length > 0) {
        return (
            <div className={playerStyles.container}>
                <div><p>{data.club}</p><p>{data.position}</p></div>
                <div style={{"height" : "130px"}}>
                <Image alt='' src={data.pictureUrl} width="130px" height="130px"/>
                </div>
                <div>
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
            </div>
            )
    } else {
        return <div className={playerStyles.container}><p>loading...</p></div>
    }
}

export default Layout