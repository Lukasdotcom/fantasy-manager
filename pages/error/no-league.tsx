import Menu from "../../components/Menu";
import Head from "next/head";
import BugReport from "../../components/BugReport";
import { useContext } from "react";
import { TranslateContext } from "../../Modules/context";
import { GetStaticProps } from "next";
import { getData } from "../api/theme";
export default function Home() {
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("No League Types Exist")}</title>
      </Head>
      <Menu />
      <h1>{t("No League Types Exist")}</h1>
      <h2>{t("What is Wrong")}</h2>
      <p>{t("There are no league plugins enabled. ")}</p>
      <h2>{t("How to Fix")}</h2>
      <p>{t("Login as the admin user and enable a league plugin. ")}</p>
      <BugReport />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: { t: await getData(context) },
  };
};
