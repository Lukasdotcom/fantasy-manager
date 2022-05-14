import { signIn, signOut, useSession } from "next-auth/react"
// A simple sign in and sign out button
export default function Layout() {
    const { data: session } = useSession()
    if (! session) {
        return (
            <button onClick={signIn}>Sign in/Sign Up</button>
        )
    } else {
        return (
            <button onClick={signOut}>Sign out</button>
        )
    }
    
}
