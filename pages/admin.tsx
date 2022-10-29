import Menu from "../components/Menu";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Head from "next/head.js";
import { getSession } from "next-auth/react";
import connect, { leagues } from "../Modules/database";
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

interface props {
  analytics: analyticsData[];
  leagues: string[];
}
interface ChartData {
  fill: boolean;
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}
interface analyticsData {
  serverID: string;
  day: number;
  version: string;
  users: number;
  activeUsers: number;
}
// This function is used to sort an array of semantic versions
function compareSemanticVersions(key: string, a: any, b: any) {
  // 1. Split the strings into their parts.
  let a1 = a[key].split(".");
  let b1 = b[key].split(".");
  const len = Math.min(a1.length, b1.length); // Look through each part of the version number and compare.
  for (let i = 0; i < len; i++) {
    const a2 = +a1[i] || 0;
    const b2 = +b1[i] || 0;
    if (a2 !== b2) {
      // Returns if they are different
      return a2 < b2 ? 1 : -1;
    }
  }
  // We hit this if the all checked versions so far are equal
  return a1.length - b1.length;
}
export default function Home({ analytics, leagues }: props) {
  const [graphLength, setGraphLength] = useState(Math.sqrt(30));
  // Sorts the analytics by version number
  const sortedAnalytics = analytics.sort((a, b) =>
    compareSemanticVersions("version", a, b)
  );
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
    plugins: {
      title: {
        display: true,
        text: "Analytics Data",
      },
    },
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
  let counter = 0;
  // Adds all the data to the dataset
  while (sortedAnalytics.length > counter) {
    type versionType = string | null;
    const version: versionType =
      historicalVersionColor.length > 0
        ? sortedAnalytics[counter].version
        : null;
    // Collects all the data for one version
    const activeData: Record<string, number> = {};
    const inactiveData: Record<string, number> = {};
    while (
      sortedAnalytics.length > counter &&
      (version === null || sortedAnalytics[counter].version === version)
    ) {
      let data = sortedAnalytics[counter];
      counter++;
      if (data) {
        if (!activeData[String(data?.day)]) {
          activeData[String(data?.day)] = 0;
        }
        activeData[String(data?.day)] += data.activeUsers;
        if (!inactiveData[String(data?.day)]) {
          inactiveData[String(data?.day)] = 0;
        }
        inactiveData[String(data?.day)] += data.users - data.activeUsers;
      }
    }
    let color = historicalVersionColor.pop();
    // If this is the other category then it switches to the other color
    if (!color) {
      color = otherVersionColor;
    }
    datasetActive.push({
      fill: true,
      label: (version ? version : "Other") + " Active",
      data: labels.map((e) =>
        activeData[String(e)] ? activeData[String(e)] : 0
      ),
      borderColor: color(1),
      backgroundColor: color(1),
    });
    datasetInActive.push({
      fill: true,
      label: (version ? version : "Other") + " Inactive",
      data: labels.map((e) =>
        inactiveData[String(e)] ? inactiveData[String(e)] : 0
      ),
      borderColor: color(0.7),
      backgroundColor: color(0.6),
    });
  }
  const data = {
    // Makes the labels nicer to read
    labels: labels.map((e) => {
      const date = new Date(e * 3600 * 24 * 1000);
      return date.toDateString();
    }),
    datasets: [...datasetActive, ...datasetInActive],
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
      <div style={{ height: "min(max(50vh, 50vw), 80vh)", width: "100%" }}>
        <Line options={options} data={data} />
      </div>
      <Typography id="graph-length" gutterBottom>
        Graph Data Length: {calculateValue(graphLength)} Days
      </Typography>
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
      <h2>Enabled League Types</h2>
      <p>
        Bundesliga is{" "}
        {leagues.includes("Bundesliga")
          ? "enabled."
          : "disabled. To enable enter a bundesliga api key as directed in the readme into the enviromental variable BUNDESLIGA_API."}
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
