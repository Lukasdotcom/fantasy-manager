import Menu from "../../components/Menu";
import Head from "next/head";
export default function Home({}) {
  return (
    <>
      <Head>
        <title>Locked Error</title>
      </Head>
      <Menu league={undefined} />
      <h1>Locked Error</h1>
      <h2>What is Wrong</h2>
      <p>
        Your account has had too may login attempts recently and is being
        temporarily locked. You can still log in through an OAuth provider.
      </p>
      <h2>How to Fix</h2>
      <p>
        Log in through an OAuth provider like google or wait at least 10 seconds
        and try again. If this problem persists please contact the administrator
        of this website.
      </p>
    </>
  );
}
