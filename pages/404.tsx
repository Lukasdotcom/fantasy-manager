import { useContext } from "react";
import Menu from "../components/Menu";
import { TranslateContext } from "../Modules/context";
import { GetStaticProps } from "next";
import { getData } from "./api/theme";

export default function Home() {
  const t = useContext(TranslateContext);
  return (
    <>
      <Menu />
      <div className="center">
        <h1>404</h1>
        <p>{t("Page not Found")}</p>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: { t: await getData(context.locale) },
  };
};
