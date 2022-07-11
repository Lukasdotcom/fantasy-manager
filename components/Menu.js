import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import navStyles from "../styles/Nav.module.css";
import Login from "./Login";
// Used to create a menu
const Layout = ({ session, league }) => {
  return (
    <nav className={navStyles.nav}>
      <Link href="/">Home</Link>
      <Link href="/info">Info</Link>
      {league && (
        <>
          <Link href={`/${league}`}>Standings</Link>
          <Link href={`/${league}/squad`}>Squad</Link>
          <Link href={`/${league}/transfer`}>Transfer</Link>
        </>
      )}
      <SessionProvider session={session}>
        <Login />
      </SessionProvider>
    </nav>
  );
};

export default Layout;
