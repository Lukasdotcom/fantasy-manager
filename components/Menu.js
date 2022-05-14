import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import navStyles from '../styles/Nav.module.css'
import Login from './Login'
// Used to create a menu
const Layout = ({session}) => {
    return (
        <nav className={navStyles.nav}>
            <Link href='/'>Home</Link>
            <SessionProvider session={session}>
            <Login />
            </SessionProvider>
        </nav>
    )
}

export default Layout