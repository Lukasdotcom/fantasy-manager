import '../styles/globals.css'
import { init, push } from "@socialgouv/matomo-next"
import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID

function MyApp({ Component, pageProps }) {
  // Used to start up matomo analytics
  useEffect(() => {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);
  return ( 
  <>
  <Component {...pageProps} />
  <SessionProvider>
    <UserMatomo />
  </SessionProvider>
  </>
  )
}

export default MyApp

// Gives the user id when logged in
function UserMatomo() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session) push(['setUserId', String(session.user.id)])
  })
  return <></>
}