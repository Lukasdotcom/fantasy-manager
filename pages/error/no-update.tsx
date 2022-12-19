import Menu from "../../components/Menu";
import Head from "next/head";
import BugReport from "../../components/BugReport";
import { useContext } from "react";
import { TranslateContext } from "../../Modules/context";
export default function Home() {
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("No Update Error")}</title>
      </Head>
      <Menu />
      <h1>{t("No Update Error")}</h1>
      <h2>{t("What is Wrong")}</h2>
      <p>
        {t(
          "The server is no longer automatically updating it's player data in the database. "
        )}
      </p>
      <h2>{t("How to Fix")}</h2>
      <p>
        {t(
          "This is very easily fixed by just restarting the server or if you can not do that yourself, tell the website admin to do it."
        )}
      </p>
      <BugReport />
    </>
  );
}
