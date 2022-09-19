import Menu from "../../components/Menu";
import Head from "next/head";
import BugReport from "../../components/BugReport";
export default function Home() {
  return (
    <>
      <Head>
        <title>Failure to get Version Data</title>
      </Head>
      <Menu league={undefined} />
      <h1>Failure to get Version Data</h1>
      <h2>What is Wrong</h2>
      <p>
        The server can not contact github to check if this is the latest version
        of the software.
      </p>
      <h2>How to Fix</h2>
      <p>
        This error is not critical at all and just means that this website can
        not check if this is actually the latest version. You should just
        manually check the{" "}
        <a
          style={{ color: "blue" }}
          href="https://github.com/Lukasdotcom/Bundesliga/releases"
          rel="noopener noreferrer"
          target="_blank"
        >
          github releases.
        </a>
        There you can see if this is the latest version of the software.
      </p>
      <BugReport />
    </>
  );
}
