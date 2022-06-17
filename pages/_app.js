import '../styles/globals.css'
import { init } from "@socialgouv/matomo-next"
import { useEffect } from 'react'
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID

function MyApp({ Component, pageProps }) {
  // Used to start up matomo analytics
  useEffect(() => {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);
  return <Component {...pageProps} />
}

export default MyApp
