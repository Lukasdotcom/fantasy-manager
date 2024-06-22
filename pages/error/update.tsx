import Menu from "../../components/Menu";
import Head from "next/head";
import BugReport from "../../components/BugReport";
import Link from "../../components/Link";
import { useContext } from "react";
import { TranslateContext } from "../../Modules/context";
import { GetStaticProps } from "next";
import { getData } from "../api/theme";
export default function Home() {
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("Failure to get Version Data")}</title>
      </Head>
      <Menu />
      <h1>{t("Failure to get Version Data")}</h1>
      <h2>{t("What is Wrong")}</h2>
      <p>
        {t(
          "The server cannot contact Github to check if this is the latest version of the software. ",
        )}
      </p>
      <h2>{t("How to Fix")}</h2>
      <p>
        {t(
          "This error is not critical and just means that this website can not check if this is actually the latest version. ",
        )}
        <Link
          href="https://github.com/Lukasdotcom/fantasy-manager/releases"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t(
            "You can manually check the github releases to see if this is the latest release. ",
          )}
        </Link>
      </p>
      <BugReport />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: { t: await getData(context) },
  };
};
