// A paragraph with a link explaining how to report bugs
export default function BugReport() {
  return (
    <>
      <h2>Reporting Bugs</h2>
      <p>
        All bugs can be reported on{" "}
        <a
          style={{ color: "blue" }}
          href="https://github.com/Lukasdotcom/Bundesliga/issues/new?assignees=&labels=&template=bug_report.md&title="
          rel="noopener noreferrer"
          target="_blank"
        >
          github
        </a>
        . These bugs are then fixed as quickly as possible
      </p>
    </>
  );
}
