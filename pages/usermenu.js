import { getSession } from "next-auth/react"
import { useState } from "react"
import Menu from "../components/Menu"
// A place to change your username and other settings
export default function Home({session, user}) {
    const [username, setUsername] = useState(user.username)
    return (
    <>
    <Menu session={session}/>
    <h1>Usermenu</h1>
    <label htmlFor="username">Edit username: </label>
    <input onChange={(e) => {
        // Used to change the username
        if (e.target.value !== "") {
            fetch(`/api/user`,{
                method : "POST",
                headers:{
                        'Content-Type':'application/json'
                    },
                body: JSON.stringify({
                    "username" : e.target.value
            })}).then(async (response) => {
                if (!response.ok) {
                    alert(await response.text())
                }
            })
        }
        setUsername(e.target.value)    
    }} value={username} id="username"></input>
    </>
    )
}
// Returns all the user data if logged in and if not logged in redirects to the login page
export async function getServerSideProps(ctx) {
    const session = await getSession(ctx)
    if (session) {
        const user = session.user
        return {props : {user}}
    } else {
        return {
            redirect : {
                destination : `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
                permanent : false,
        }}
    }
}