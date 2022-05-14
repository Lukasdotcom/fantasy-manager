import '../styles/globals.css'
import Menu from "../components/Menu"

function MyApp({ Component, session, pageProps }) {
  return <>
          <Menu session={session}/>
          <Component session={session} {...pageProps} />
        </>
}

export default MyApp
