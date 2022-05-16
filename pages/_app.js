import '../styles/globals.css'
import Menu from "../components/Menu"
import Head from 'next/head'

function MyApp({ Component, session, pageProps }) {
  return <>
      <Menu session={session}/>
      <Component {...pageProps} />
      </>
}

export default MyApp
