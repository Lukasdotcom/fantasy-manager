import Menu from "../components/Menu";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Head from "next/head.js";
import { getSession } from "next-auth/react";
import connect, { analytics, leagues } from "../Modules/database";
import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Slider, Typography, useTheme } from "@mui/material";
import { compareSemanticVersions } from "../Modules/semantic";

interface props {
  analytics: analytics[];
  leagues: string[];
}
export default function Home({ analytics, leagues }: props) {
  const [graphLength, setGraphLength] = useState(30);
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
  );

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Users",
        },
      },
    },
  };
  // List of all the versions
  const versions: string[] = Object.keys(
    JSON.parse(analytics[analytics.length - 1].versionTotal)
  );
  const leagueList: string[] = Object.keys(
    JSON.parse(analytics[analytics.length - 1].leagueTotal)
  );
  const locales: string[] = Object.keys(
    JSON.parse(analytics[analytics.length - 1].localeTotal)
  );
  // Calculates colors for things
  const calculateColor = (idx: number, length: number) => {
    length = length + 1;
    return ((length - idx) * 360) / length - 120;
  };
  // Calculates the hue for an id for the version number
  const calculateVersionColor = (idx: number) => {
    return calculateColor(idx, 14);
  };
  versions.sort((a, b) => compareSemanticVersions(a, b));
  const slicedAnalytics = analytics.slice(graphLength * -1);
  const labels = slicedAnalytics.map((e) => {
    const date = new Date(e.day * 3600 * 24 * 1000);
    return date.toDateString();
  });
  // Data for the version graph
  const versionData = {
    labels,
    datasets: [
      ...versions.map((version, idx) => {
        return {
          fill: true,
          label: version + " Active",
          data: slicedAnalytics.map(
            (e) => JSON.parse(e.versionActive)[version] ?? 0
          ),
          borderColor: `hsla(${calculateVersionColor(idx)}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateVersionColor(idx)}, 100%, 50%, 1)`,
        };
      }),
      ...versions.map((version, idx) => {
        return {
          fill: false,
          label: version + " Inactive",
          data: slicedAnalytics.map(
            (e) =>
              (JSON.parse(e.versionTotal)[version] ?? 0) -
              (JSON.parse(e.versionActive)[version] ?? 0)
          ),
          borderColor: `hsla(${calculateVersionColor(idx)}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateVersionColor(idx)}, 100%, 50%, 0)`,
        };
      }),
    ],
  };
  // Data for the league graph
  const leagueData = {
    labels,
    datasets: [
      ...leagueList.map((league, idx) => {
        return {
          fill: true,
          label: league + " Active",
          data: slicedAnalytics.map(
            (e) => JSON.parse(e.leagueActive)[league] ?? 0
          ),
          borderColor: `hsla(${calculateColor(
            idx,
            league.length
          )}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateColor(
            idx,
            league.length
          )}, 100%, 50%, 1)`,
        };
      }),
      ...leagueList.map((league, idx) => {
        return {
          fill: true,
          label: league + " Inactive",
          data: slicedAnalytics.map(
            (e) =>
              (JSON.parse(e.leagueTotal)[league] ?? 0) -
              (JSON.parse(e.leagueActive)[league] ?? 0)
          ),
          borderColor: `hsla(${calculateColor(
            idx,
            league.length
          )}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateColor(
            idx,
            league.length
          )}, 100%, 50%, 0)`,
        };
      }),
    ],
  };
  // Gets the locale data
  const localeData = {
    labels,
    datasets: [
      ...locales.map((locale, idx) => {
        return {
          fill: true,
          label: locale + " Active",
          data: slicedAnalytics.map(
            (e) => JSON.parse(e.localeActive)[locale] ?? 0
          ),
          borderColor: `hsla(${calculateColor(
            idx,
            locale.length
          )}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateColor(
            idx,
            locale.length
          )}, 100%, 50%, 1)`,
        };
      }),
      ...locales.map((locale, idx) => {
        return {
          fill: true,
          label: locale + " Inactive",
          data: slicedAnalytics.map(
            (e) =>
              (JSON.parse(e.localeTotal)[locale] ?? 0) -
              (JSON.parse(e.localeActive)[locale] ?? 0)
          ),
          borderColor: `hsla(${calculateColor(
            idx,
            locale.length
          )}, 100%, 50%, 1)`,
          backgroundColor: `hsla(${calculateColor(
            idx,
            locale.length
          )}, 100%, 50%, 0)`,
        };
      }),
    ],
  };
  // Gets the theme data
  const darkColor = dark ? 30 : 0;
  const lightColor = dark ? 100 : 80;
  const themeData = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Dark Active",
        data: slicedAnalytics.map((e) => JSON.parse(e.themeActive).dark ?? 0),
        borderColor: `hsla(0, 0%, ${darkColor}%, 1)`,
        backgroundColor: `hsla(0, 0%, ${darkColor}%, 1)`,
      },
      {
        fill: true,
        label: "Light Active",
        data: slicedAnalytics.map((e) => JSON.parse(e.themeActive).light ?? 0),
        borderColor: `hsla(120, 0%, ${lightColor}%, 1)`,
        backgroundColor: `hsla(120, 0%, ${lightColor}%, 1)`,
      },
      {
        fill: true,
        label: "Dark Inactive",
        data: slicedAnalytics.map(
          (e) =>
            (JSON.parse(e.themeTotal).dark ?? 0) -
            (JSON.parse(e.themeActive).dark ?? 0)
        ),
        borderColor: `hsla(0, 0%, ${darkColor}%, 1)`,
        backgroundColor: `hsla(0, 0%, ${darkColor}%, 0)`,
      },
      {
        fill: true,
        label: "Light Inactive",
        data: slicedAnalytics.map(
          (e) =>
            (JSON.parse(e.themeTotal).light ?? 0) -
            (JSON.parse(e.themeActive).light ?? 0)
        ),
        borderColor: `hsla(120, 0%, ${lightColor}%, 1)`,
        backgroundColor: `hsla(120, 0%, ${lightColor}%, 0)`,
      },
    ],
  };
  // Handles when the graph slider changes
  function graphLengthChange(e: Event, value: number | number[]) {
    if (typeof value === "number") {
      setGraphLength(value);
    }
  }
  return (
    <>
      <Head>
        <title>Admin Panel</title>
      </Head>
      <Menu />
      <h1>Admin Panel</h1>
      <h2>Analytics</h2>
      <h3>Version Data</h3>
      <p>
        This graph shows how many users are using each (server) version. Active
        users are defined as users that are active on that day.
      </p>
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "95%" }}>
        <Line options={options} data={versionData} />
      </div>
      <h3>League Type Data</h3>
      <p>
        This graph shows how many users are using each league type. Note that
        users are counted based on how many leagues they are in.
      </p>
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "95%" }}>
        <Line options={options} data={leagueData} />
      </div>
      <h3>Locale Data</h3>
      <p>This graph shows how many users are using which languages.</p>
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "95%" }}>
        <Line options={options} data={localeData} />
      </div>
      <h3>Theme Data</h3>
      <p>This graph shows how many users are using dark vs light theme.</p>
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "95%" }}>
        <Line options={options} data={themeData} />
      </div>
      <Typography id="graph-length" gutterBottom>
        Graph Data Length: {graphLength} Days
      </Typography>
      <div style={{ width: "95%", margin: "2%" }}>
        <Slider
          value={graphLength}
          min={1}
          step={1}
          max={Math.max(analytics.length, 30)}
          onChange={graphLengthChange}
          valueLabelDisplay="auto"
          aria-labelledby="non-linear-slider"
        />
      </div>
      <h2>Enabled League Types</h2>
      <p>
        The Bundesliga is{" "}
        {leagues.includes("Bundesliga")
          ? "enabled."
          : "disabled. To enable enter a bundesliga api key as directed in the leagues.md file into the enviromental variable BUNDESLIGA_API."}
      </p>
      <p>
        The English Premier League is{" "}
        {leagues.includes("EPL")
          ? "enabled."
          : "disabled. To enable set the enviromental variable ENABLE_EPL to enable."}
      </p>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  ctx: GetServerSidePropsContext
) => {
  const user = await getSession(ctx);
  // Makes sure the user is logged in
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          ctx.resolvedUrl
        )}`,
        permanent: false,
      },
    };
  }
  if (user.user.admin) {
    // Used to find the amount of historical data to get
    const connection = await connect();
    const analytics = await connection.query(
      "SELECT * FROM analytics ORDER By day ASC"
    );
    connection.end();
    return {
      props: { analytics, leagues },
    };
  }
  return {
    notFound: true,
  };
};
