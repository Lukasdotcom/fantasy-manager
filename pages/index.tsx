import Head from "next/head";
import Menu from "../components/Menu";
import Image from "next/image";
import MainImage from "../screenshots/main.webp";
import Transfer1Image from "../screenshots/transfers1.webp";
import Transfer2Image from "../screenshots/transfers2.webp";
import StandingsImage from "../screenshots/standings.webp";
import SquadImage from "../screenshots/squad.webp";
import { Alert, AlertColor, AlertTitle, Pagination } from "@mui/material";
import { useEffect, useState } from "react";
import version from "./../package.json" assert { type: "json" };
import Link from "../components/Link";
import { GetStaticProps, InferGetStaticPropsType } from "next";
interface InnerUpdateType {
  type: AlertColor;
  title: string;
  text: string;
  link?: string;
}
type UpdateType = InnerUpdateType | undefined;
interface CurrentPictureProps {
  picture: number;
}
interface Props {
  update: UpdateType;
}
// Turns the number into the correct screenshot
function CurrentPicture({ picture }: CurrentPictureProps) {
  switch (picture) {
    case 1:
      return (
        <Image
          alt="Screenshot of Main Page"
          src={MainImage}
          height={540}
          width={960}
        ></Image>
      );
    case 2:
      return (
        <Image
          alt="Screenshot of Standings"
          src={StandingsImage}
          height={540}
          width={960}
        ></Image>
      );
    case 3:
      return (
        <Image
          alt="Screenshot of Squad"
          src={SquadImage}
          height={540}
          width={960}
        ></Image>
      );
    case 4:
      return (
        <Image
          alt="Screenshot of Transfers"
          src={Transfer1Image}
          height={540}
          width={960}
        ></Image>
      );
    case 5:
      return (
        <Image
          alt="Screenshot of Transfers"
          src={Transfer2Image}
          height={540}
          width={960}
        ></Image>
      );
    default:
      return (
        <Image
          alt="Screenshot of Main Page"
          src={MainImage}
          height={540}
          width={960}
        ></Image>
      );
  }
}
// Shows all the screenshots and allows the user to pick screenshots they would like to see
function Carrousel() {
  const pictures = 5;
  const [picture, setPicture] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      picture < pictures ? setPicture(picture + 1) : setPicture(1);
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [picture]);

  return (
    <>
      <Pagination
        count={pictures}
        size="small"
        page={picture}
        onChange={(e, value) => setPicture(value)}
      />
      <CurrentPicture picture={picture} />
    </>
  );
}
export default function Home({
  update,
}: // For some reason the inference does not work here
InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Bundesliga Fantasy</title>
      </Head>
      <Menu />
      <h1>Bundesliga Fantasy Manager</h1>
      <p>
        A modern open source Fantasy Bundesliga Manager. The source code is
        available on{" "}
        <Link
          href="https://github.com/Lukasdotcom/bundesliga-manager"
          rel="noopener noreferrer"
          target="_blank"
        >
          github.
        </Link>
        The goal of this is to be the best place to play a fantasy bundesliga
        manager with your friends. The rules are located in the rules tab in the
        menu. To play you must have an account which is free to do in the log in
        button in the top right of the screen.
      </p>
      <h2>Feature</h2>
      <ol>
        <li> Completely free and open source.</li>
        <li>Unlimited users and unlimited leagues.</li>
        <li>Customize starting money.</li>
        <li>Customize starred player bonus.</li>
        <li>
          Limit transfer amount(Note all users are allowed unlimited transfers
          while they have an empty squad).
        </li>
        <li>
          Ability to allow players to be bought by multiple users in the same
          league.
        </li>
        <li>Ranking tables for(Only in leagues):</li>
        <ol>
          <li>Top points for every matchday</li>
          <li>Top points in total</li>
        </ol>
        <li>Many ways to search through players:</li>
        <ol>
          <li>By price.</li>
          <li>By total points.</li>
          <li>By average points.</li>
          <li>
            By the last match points(Requires the server to have been up for the
            last match day).
          </li>
          <li>By Club.</li>
          <li>By Name.</li>
          <li>By Position.</li>
        </ol>
        <li>Download player data as json or csv</li>
        <li>See all historical user data(As long as the server was up).</li>
        <li>And all of these features in a Modern Responsive UI.</li>
      </ol>
      <h2>Community</h2>
      You can go to the{" "}
      <Link
        href="https://github.com/Lukasdotcom/bundesliga-manager/discussions"
        rel="noopener noreferrer"
        target="_blank"
      >
        github discussions
      </Link>{" "}
      to ask questions or find leagues to join.
      <h2>Screenshots</h2>
      <Carrousel />
      {update !== "undefined" && (
        <Alert severity={update.type} className="notification">
          <AlertTitle>{update.title}</AlertTitle>
          {update.link === undefined && update.text}
          {update.link !== undefined && (
            <Link href={update.link} rel="noreferrer" target="_blank">
              {update.text}
            </Link>
          )}
        </Alert>
      )}
    </>
  );
}
export const getStaticProps: GetStaticProps = async () => {
  let update: UpdateType = undefined;
  // Checks if this is running in a non production setup
  if (process.env.APP_ENV === "development" || process.env.APP_ENV === "test") {
    update = {
      type: "info",
      title: "Not for Production",
      text: "This is the development or testing version of this software. Do not use in production.",
    };
  } else {
    // Checks if this is the latest version and if it does adds data
    console.log("Checking for updates");
    interface release {
      url: string;
      assets_url: string;
      upload_url: string;
      html_url: string;
      id: number;
      tag_name: string;
      name: string;
      draft: boolean;
      prerelease: boolean;
      body: string;
    }
    const releases: release[] | [] = await fetch(
      "https://api.github.com/repos/lukasdotcom/bundesliga-manager/releases"
    ).then((res) => (res.ok ? res.json() : []));
    // Finds the first release that is not a draft or a prerelease and the same major version
    let counter = 0;
    while (
      counter < releases.length &&
      !releases[counter].prerelease &&
      !releases[counter].draft &&
      releases[0].tag_name.slice(0, 2) !== "1."
    ) {
      counter += 1;
    }
    if (counter >= releases.length) {
      console.log("Failed to get version data from github api.");
      update = {
        type: "error",
        title: "Failure",
        text: "Failing to check for updates.",
        link: "/error/update",
      };
    } else if (version.version !== releases[0].tag_name) {
      update = {
        type: "warning",
        title: "Out of Date",
        text: "New Update Available for more info Click Here",
        link: releases[0].html_url,
      };
    }
  }
  return {
    props: { update },
    // Checks at max every day
    revalidate: 3600 * 24,
  };
};
