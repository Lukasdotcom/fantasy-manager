import Menu from "../../components/Menu"
import redirect from "../../Modules/league"
import Head from "next/head"
export default function Home({session, league}) {
    return (
    <>
    <Head>
      <title>Transfers</title>
    </Head>
    <Menu session={session} league={league}/>
    </>
  )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    return await redirect(ctx, {})
}