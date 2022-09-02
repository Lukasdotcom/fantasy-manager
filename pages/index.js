import Head from "next/head";
import Menu from "../components/Menu";
import Image from "next/image";
import MainImage from "../screenshots/main.webp";
import TransferImage from "../screenshots/transfers.webp";
import StandingsImage from "../screenshots/standings.webp";
import SquadImage from "../screenshots/squad.webp";
import { Pagination } from "@mui/material";
import { useEffect, useState } from "react";
// Turns the number into the correct screenshot
function CurrentPicture({ picture }) {
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
          width={303}
        ></Image>
      );
    case 4:
      return (
        <Image
          alt="Screenshot of Transfers"
          src={TransferImage}
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
  const pictures = 4;
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
export default function Home({ session }) {
  return (
    <>
      <Head>
        <title>Bundesliga Fantasy</title>
      </Head>
      <Menu session={session} />
      <h1>Bundesliga Fantasy Manager</h1>
      <p>
        A modern open source Fantasy Bundesliga Manager. The source code is
        available on{" "}
        <a
          style={{ color: "blue" }}
          href="https://github.com/Lukasdotcom/Bundesliga"
          rel="noopener noreferrer"
          target="_blank"
        >
          github.
        </a>
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
      <a
        style={{ color: "blue" }}
        href="https://github.com/Lukasdotcom/Bundesliga/discussions"
        rel="noopener noreferrer"
        target="_blank"
      >
        github discussions
      </a>{" "}
      to ask questions or find leagues to join.
      <h2>Screenshots</h2>
      <Carrousel />
    </>
  );
}
