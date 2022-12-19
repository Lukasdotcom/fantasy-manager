import { useContext } from "react";
import Link from "../components/Link";
import { TranslateContext } from "../Modules/context";

// A paragraph with a link explaining how to report bugs
export default function BugReport() {
  const t = useContext(TranslateContext);
  return (
    <>
      <h2>{t("Reporting Bugs")}</h2>
      <p>
        <Link
          href="https://github.com/Lukasdotcom/fantasy-manager/issues/new?assignees=&labels=&template=bug_report.md&title="
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("All bugs can be reported on Github. ")}
        </Link>
        {t("These bugs are then fixed as quickly as possible. ")}
      </p>
    </>
  );
}
