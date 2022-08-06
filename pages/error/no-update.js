import Menu from "../../components/Menu";
import Head from "next/head";
import BugReport from "../../components/BugReport";
export default function Home({ session }) {
  return (
    <>
      <Head>
        <title>No Update Error</title>
      </Head>
      <Menu session={session} />
      <h1>No Update Error</h1>
      <h2>What is Wrong</h2>
      <p>
        The server is no longer automatically updating its data in the database.
      </p>
      <h2>How to Fix</h2>
      <p>
        This is very easily fixed by just restarting the server or if you can
        not do that yourself, tell the server admin to do it.
      </p>
      <BugReport />
    </>
  );
}
