import Link from "../components/Link";

// A paragraph with a link explaining how to report bugs
export default function BugReport() {
  return (
    <>
      <h2>Reporting Bugs</h2>
      <p>
        All bugs can be reported on{" "}
        <Link
          href="https://github.com/Lukasdotcom/bundesliga-manager/issues/new?assignees=&labels=&template=bug_report.md&title="
          rel="noopener noreferrer"
          target="_blank"
        >
          Github
        </Link>
        . These bugs are then fixed as quickly as possible
      </p>
    </>
  );
}
