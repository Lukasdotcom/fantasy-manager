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
        <title>{t("Locked User")}</title>
      </Head>
      <Menu />
      <h1>{t("Locked User")}</h1>
      <h2>{t("What is Wrong")}</h2>
      <p>
        {t(
          "Your account has had too many failed login attempts recently and is being temporarily locked. ",
        )}
      </p>
      <h2>{t("How to Fix")}</h2>
      <p>
        {t(
          "Log in through an OAuth provider like google or wait at least 10 seconds and try again. If this problem persists please contact the administrator of this website. ",
        )}
      </p>
      <BugReport />
    </>
  );
}
