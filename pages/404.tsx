import { useContext } from "react";
import Menu from "../components/Menu";
import { TranslateContext } from "../Modules/context";

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
