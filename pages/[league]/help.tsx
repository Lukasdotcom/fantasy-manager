import Head from "next/head";
import { createRef, useContext, useState } from "react";
import { GetServerSideProps } from "next";
import { TranslateContext } from "../../Modules/context";
import connect, { leagueSettings } from "../../Modules/database";
import { Button, Icon, IconButton, Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
export default function Home(props: leagueSettings) {
  const t = useContext(TranslateContext);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [listView, setListView] = useState(false);
  const router = useRouter();
  const iframe = createRef<HTMLIFrameElement>();
  const tutorial = [
    {
      title: t("Welcome"),
      text: t(
        "This is the welcome page for the tutorial. You can use the right and left arrows at the bottom of the page to navigate through the tutorial and the X in the top right of the screen to leave the tutorial. ",
      ),
    },
    {
      title: t("Transfers"),
      text: t(
        "Open up the transfers page on the website. At the top of the transfers page are a few things like ways of filtering players, the total amount of money you have left, and how long the transfer market is still open or closed. Here you can buy players. Now click the {buy} button to buy a player. ",
        { buy: t("Buy") },
      ),
    },
    {
      title: t("Transfer Details"),
      text: t(
        "Now you should see a window with that players transfer details. At the top is the players name. Underneath that you can see a section that is called transfers. This section shows the buyers and sellers of that player and how much they are paying right now for that player. Underneath that section is the Owners section. This section has a list of users that own that player. In this league {number} user(s) can have the same player. Then underneath that is how much you are willing to buy the player for. Note this is the maximum you are willing to pay. ",
        { number: props.duplicatePlayers },
      ),
    },
    {
      title: t("Player Details"),
      text: t(
        "Now click on a players name. You should now see that players detailed statistics including the history of that player at the bottom. You can go back now to the transfers page. ",
      ),
    },
    {
      title: t("Buying your Team"),
      text: t(
        t(
          "You can now close the player transfer details window. Now you should buy your team. It is reccomended to buy 2 Goalkeepers, 5 Defenders, 5 Midfielders, and 3 Attackers, but you can buy as many or as few as you want. Note that you can always cancel your purchases and get refunded the players value. Once you have bought your team go to the next step. ",
        ),
      ),
    },
    {
      title: t("Setting Up Your Squad"),
      text: t(
        t(
          "Now you should go to the squad page. Here you can setup your squad. You can change your formation at the top. You can move players from the bench to the field and back again. You can also star one forward, one midfielder, and one defender. Starred players get {star_bonus}% of the points they would normally get. Once a player has played on that matchday you can not move them back onto the field or star them. Players on the bench earn you no points. ",
          { star_bonus: props.starredPercentage },
        ),
      ),
    },
    {
      title: t("Final Tips"),
      text: t(
        t(
          "This is all you have to do for now. Between every matchday you can buy or sell {amount} players to improve your squad. You can click on the settings gear to change your user's settings. You can also click on the leagues page to show all the leagues you are in. On the league standings page is also a list of all the rules inside of this league. ",
          { amount: props.transfers },
        ),
      ),
    },
  ];
  const exit = () => {
    router.push(iframe?.current?.contentWindow?.location.href ?? "/");
  };
  return (
    <>
      <Head>
        <title>{t("Help")}</title>
      </Head>
      <Tooltip title={t("Exit Tutorial")}>
        <IconButton
          onClick={exit}
          style={{ position: "absolute", top: 0, right: 0, zIndex: 99999999 }}
        >
          <Icon>close</Icon>
        </IconButton>
      </Tooltip>
      {!listView && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          <iframe
            ref={iframe}
            src={`/${router.locale}/${props.leagueID}`}
            style={{
              width: "100%",
              height: "100%",
            }}
          ></iframe>
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <IconButton
              disabled={tutorialIndex <= 0}
              onClick={() => {
                setTutorialIndex(tutorialIndex - 1);
              }}
            >
              <Icon>arrow_back</Icon>
            </IconButton>
            <div style={{ textAlign: "center" }}>
              <h2>{tutorial[tutorialIndex].title}</h2>
              <p>{tutorial[tutorialIndex].text}</p>
              {tutorialIndex == 0 && (
                <Button onClick={() => setListView(true)}>
                  {t("Switch to List View")}
                </Button>
              )}
            </div>
            <IconButton
              disabled={tutorialIndex >= tutorial.length - 1}
              onClick={() => {
                setTutorialIndex(tutorialIndex + 1);
              }}
            >
              <Icon>arrow_forward</Icon>
            </IconButton>
          </div>
        </div>
      )}
      {listView && (
        <>
          <Button onClick={() => setListView(false)}>
            {t("Switch to Step View")}
          </Button>
          {tutorial.map((step, index) => (
            <div key={index}>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          ))}
        </>
      )}
    </>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const connection = await connect();
  const settings: leagueSettings[] = await connection.query(
    "SELECT * FROM leagueSettings WHERE leagueID=?",
    [context?.params?.league],
  );
  if (settings.length === 0) {
    return {
      notFound: true,
    };
  }
  // Makes sure to say that the league tutorial has been looked at
  connection.query(
    "UPDATE leagueUsers SET tutorial=0 WHERE leagueID=? AND user=?",
    [
      context?.params?.league,
      (await getServerSession(context.req, context.res, authOptions))?.user.id,
    ],
  );
  return { props: JSON.parse(JSON.stringify(settings[0])) };
};
