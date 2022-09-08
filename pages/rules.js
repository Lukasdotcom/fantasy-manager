import Menu from "../components/Menu";
import Head from "next/head";
import BugReport from "../components/BugReport";
export default function Home({ session }) {
  return (
    <>
      <Head>
        <title>Rules</title>
      </Head>
      <Menu session={session} />
      <h1>Rules</h1>
      <h2>Transfers</h2>
      <p>
        You will start with a budget of 150 million(unless your league settings
        say differently) and will be able to purchase players from the transfer
        market. As long as you have 0 players in your squad there is no limit on
        the transfers but once you have succesfully bought a player at the end
        of the transfer period you have a transfer limit that is set in the
        league settings. You may buy as many players as you want there is no
        maximum squad size. The transfer window is open between matchdays. Each
        player can only be bought by one user(unless the league has different
        rules), but to not make it first come first serve you can bid on players
        and the user that will pay the most for the player gets the player. You
        can always sell a player for the market price and must always pay at a
        minimum the market price for a player. You can cancel the sale of one of
        your players as long as you have enough money to buy them back for the
        price that player is bought from you. You can also cancel buying a
        player but you will only be refunded the value of the player.
      </p>
      <h3>Pricing and Points</h3>
      <p>
        The points are calculated by the way{" "}
        <a
          style={{ color: "blue" }}
          href="https://fantasy.bundesliga.com/page/scoring_rules"
          rel="noopener noreferrer"
          target="_blank"
        >
          shown here
        </a>
        . Player pricing changes based on the performance of the player. Price
        increase:
        <br />
        400,000 - 10 or more points above the position average
        <br />
        300,000 - 6 to 9 points above the position average
        <br />
        200,000 - 3 to 5 points above the position average
        <br />
        No Change - 0 to 2 points above the position average
        <br />
        300,000 - winning the official Player of the Month award
        <br />
        100,000 - winner of an &quot;in-form card&quot; in the official
        &quot;Team of the Week&quot; of the official license partner of the
        Bundesliga EA SPORTS
        <br />
        <br />
        Price decreases:
        <br />
        No Change - 0 to 2 points below the position average
        <br />
        200,000 - 3 to 5 points below the position average
        <br />
        300,000 - 6 to 9 points below the position average
        <br />
        400,000 - 10 or more points below the position average
        <br />
        <br />
        Other factors:
        <br />
        -100,000 for any player not playing during the match day -100,000 for
        any player receiving a red card independent of minutes played. <br />
        Player value can not drop below 1,000,000 Player value is determined
        after all the matches of the week have been played.
      </p>
      <h2>Squad Management</h2>
      <p>
        In your squad you can move players from the bench to the field and vice
        versa. Once a player&apos;s team has started playing you can not move
        the player onto the field anymore. You do not need to play with 11
        players but you are limited to playing with a maximum of 11 players.
        There are 7 formations you can play as and you can change to a formation
        as long as you don&apos;t have too many players in a position. Ex: If
        you have 2 attackers on the field and are using the 4-4-2 formation you
        can switch to the 3-4-3 formation but not to the 5-4-1 formation. There
        are also starred players. You can star one attacker, one midfielder, and
        one defender. Those starred players will get 150% as many points as
        normally unless your league has that rule changed. You can make a player
        a starred player as long as their team has not started playing.
      </p>
      <h1>Installing as an App</h1>
      <p>
        I don&apos;t really want to pay $100 to get an apple developer license
        so there is not an app you can install from the app store or play store.
        But if you want something close to an app you can install a PWA. This
        will look like a regular app but won&apos;t cost me anything to offer.
        To install this click{" "}
        <a
          style={{ color: "blue" }}
          href="https://web.dev/learn/pwa/installation/"
          rel="noopener noreferrer"
          target="_blank"
        >
          here for the steps on how to install a PWA
        </a>
        .
      </p>
      <BugReport />
    </>
  );
}
