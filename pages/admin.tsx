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
import { Slider, Typography } from "@mui/material";
import { compareSemanticVersions as compareSemantic } from "../Modules/semantic";

interface props {
  analytics: analytics[];
  leagues: string[];
}
interface ChartData {
  fill: boolean;
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}
// This function is used to sort an array of semantic versions
function compareSemanticVersions(key: string, a: any, b: any) {
  return compareSemantic(a[key], b[key]);
}
export default function Home({ analytics, leagues }: props) {
  const [graphLength, setGraphLength] = useState(Math.sqrt(30));
  // Sorts the analytics by version number
  // const sortedAnalytics = analytics.sort((a, b) =>
  //   compareSemanticVersions("version", a, b)
  // );
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
  // Adds all the unique dates to a list
  const fullLabels: number[] = [];
  analytics.forEach((e) => {
    const date = e.day;
    if (!fullLabels.includes(date)) {
      fullLabels.push(date);
    }
  });
  fullLabels.sort();
  const labels = fullLabels.slice(calculateValue(graphLength) * -1);
  const historicalVersionColor = [
    (a: number) => `rgba(102, 187, 106, ${a})`,
    (a: number) => `rgba(41, 182, 246, ${a})`,
    (a: number) => `rgba(144, 202, 249, ${a})`,
    (a: number) => `rgba(206, 147, 216, ${a})`,
    (a: number) => `rgba(255, 167, 38, ${a})`,
  ];
  const otherVersionColor = (a: number) => `rgba(244, 67, 54, ${a})`;
  historicalVersionColor.reverse();
  const datasetActive: ChartData[] = [];
  const datasetInActive: ChartData[] = [];
  const BundesligaData: Record<string, number> = {};
  const BundesligaActiveData: Record<string, number> = {};
  const EPLData: Record<string, number> = {};
  const EPLActiveData: Record<string, number> = {};
  const WorldCup2022Data: Record<string, number> = {};
  const WorldCup2022ActiveData: Record<string, number> = {};
  const versionData = {
    // Makes the labels nicer to read
    labels: labels.map((e) => {
      const date = new Date(e * 3600 * 24 * 1000);
      return date.toDateString();
    }),
    datasets: [...datasetActive, ...datasetInActive],
  };
  const leagueData = {
    // Makes the labels nicer to read
    labels: labels.map((e) => {
      const date = new Date(e * 3600 * 24 * 1000);
      return date.toDateString();
    }),
    datasets: [],
  };
  // This is used to give the scale a logarithmic values
  function calculateValue(value: number) {
    return Math.floor(value ** 2);
  }
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
        users are counted based on how many leagues they are in and that this
        data only exists for servers on v1.8.0 or later.
      </p>
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "95%" }}>
        <Line options={options} data={leagueData} />
      </div>
      <Typography id="graph-length" gutterBottom>
        Graph Data Length: {calculateValue(graphLength)} Days
      </Typography>
      <div style={{ width: "95%", margin: "2%" }}>
        <Slider
          value={graphLength}
          min={1}
          step={Math.floor(Math.sqrt(Math.max(fullLabels.length, 30))) / 100}
          max={Math.sqrt(Math.max(fullLabels.length, 30))}
          scale={calculateValue}
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
      <p>
        The World Cup 2022 is{" "}
        {leagues.includes("WorldCup2022")
          ? "enabled."
          : "disabled. To enable set the enviromental variable ENABLE_WORDCUP2022 to enable."}
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
