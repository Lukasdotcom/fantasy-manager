import Head from "next/head";
import Menu from "../components/Menu";
import Image from "next/image";
import {
  Alert,
  AlertColor,
  AlertTitle,
  Pagination,
  useTheme,
  Box,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import version from "./../package.json";
import Link from "../components/Link";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import getLocales from "../locales/getLocales";
import { TranslateContext } from "../Modules/context";
interface InnerUpdateType {
  type: AlertColor;
  title: string;
  text: string;
  link?: string;
}
type UpdateType = InnerUpdateType | {};
interface CurrentPictureProps {
  picture: number;
}
// Turns the number into the correct screenshot
function CurrentPicture({ picture }: CurrentPictureProps) {
  // Gets the name of the picture
  function picturePicker(picture: number) {
    switch (picture) {
      case 1:
        return "Main";
      case 2:
        return "Standings";
      case 3:
        return "Squad";
      case 4:
        return "Transfer";
      case 5:
        return "DetailedPlayer";
      case 6:
        return "LeagueAdmin";
      default:
        return "Usermenu";
    }
  }
  const theme = useTheme();
  const name = picturePicker(picture);
  const actualSrc =
    "/screenshots/" +
    name +
    (theme.palette.mode === "dark" ? "Dark" : "Light") +
    ".webp";
  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "56vw",
          position: "absolute",
          display: { xs: "block", md: "none" },
        }}
      >
        <Image
          alt={"Screenshot of " + name + " page"}
          src={actualSrc}
          fill={true}
        />
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Image
          alt={"Screenshot of " + name + " page"}
          src={actualSrc}
          height={506}
          width={900}
        />
      </Box>
    </>
  );
}
// Shows all the screenshots and allows the user to pick screenshots they would like to see
function Carrousel() {
  const pictures = 7;
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
  const t = useContext(TranslateContext);
  return (
    <>
      <Head>
        <title>{t("Open Source Fantasy Manager")}</title>
      </Head>
      <Menu />
      <h1>{t("Open Source Fantasy Manager")}</h1>
      <p>
        {t("A modern open source Fantasy Manager. ")}
        <Link
          href="https://github.com/Lukasdotcom/fantasy-manager"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("The source code is available on Github. ")}
        </Link>
        {t(
          "The goal of this site is to be the best place to play a Fantasy Manager with your friends and family. "
        )}
        {t(
          "To play you must have an account which is free to do in the log in button in the top right of the screen. "
        )}
      </p>
      <h2>{t("Features")}</h2>
      <ol>
        <li>{t("Completely free and open source. ")}</li>
        <li>{t("Many different leagues to use(Bundesliga, EPL, etc). ")}</li>
        <li>{t("Unlimited users and unlimited leagues for every user. ")}</li>
        <li>{t("Customize starting money. ")}</li>
        <li>{t("Customize starred player bonus. ")}</li>
        <li>{t("Limit transfer amount. ")}</li>
        <li>
          {t(
            "Ability to allow players to be bought by multiple users in the same league. "
          )}
        </li>
        <li>{t("Ranking tables for matchday points and total points. ")}</li>
        <li>
          {t(
            "Many ways to search through players including price, points, position, club, name, etc. "
          )}
        </li>
        <li>{t("Download historical player data as json or csv. ")}</li>
        <li>
          {t(
            "View historical data for a player and what leagues player played in. "
          )}
        </li>
        <li>{t("See historical squads for every league. ")}</li>
        <li>
          {t(
            "And all of these features in a Modern Responsive UI available in a light and dark theme and multiple languages. "
          )}
        </li>
      </ol>
      <h2>{t("Community")}</h2>
      <Link
        href="https://github.com/Lukasdotcom/fantasy-manager/discussions"
        rel="noopener noreferrer"
        target="_blank"
      >
        {t(
          "You can go to the Github Discussions to ask questions or find leagues to join. "
        )}
      </Link>{" "}
      <h2>{t("Screenshots")}</h2>
      <Carrousel />
      {update.type && (
        <Alert severity={update.type} className="notification">
          <AlertTitle>{t(update.title)}</AlertTitle>
          {update.link === undefined && <p>{t(update.text)}</p>}
          {update.link && (
            <Link href={update.link} rel="noopener noreferrer">
              {t(update.text)}
            </Link>
          )}
        </Alert>
      )}
    </>
  );
}
export const getStaticProps: GetStaticProps = async (context) => {
  let update: UpdateType = {};
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
    interface data {
      name: string;
      version: string;
    }
    const data: data | undefined = await fetch(
      "https://raw.githubusercontent.com/Lukasdotcom/fantasy-manager/stable/package.json"
    ).then((res) => (res.ok ? res.json() : undefined));
    if (!data) {
      console.log("Failed to get version data from Github.");
      update = {
        type: "error",
        title: "Failure",
        text: "Failing to check for updates.",
        link: "/error/update",
      };
    } else if (version.version !== data.version) {
      update = {
        type: "warning",
        title: "Out of Date",
        text: "New Update Available for more info Click Here",
        link: `https://github.com/Lukasdotcom/fantasy-manager/releases/tag/${data.version}`,
      };
    }
  }
  return {
    props: { update, t: await getLocales(context.locale) },
    // Checks at max every day
    revalidate: 3600 * 24,
  };
};
