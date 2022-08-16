import playerStyles from "../styles/Player.module.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import { push } from "@socialgouv/matomo-next";
import { useSession } from "next-auth/react";
import Username from "../components/Username";
import fallbackImg from "../public/playerFallback.png";
import Link from "next/link";
import { Button, CircularProgress } from "@mui/material";
// Used to create the layout for a player card that shows some simple details on a player just requires the data of the player to be passed into it and you can pass a custom button as a child of the component
// extraText is shown in parenthesis next to the player name
function InternalPlayer({ data, children, starred, extraText }) {
  const [countdown, setCountown] = useState(0);
  const [pictureUrl, setPictureUrl] = useState(undefined);
  useEffect(() => {
    const id = setInterval(
      () => setCountown((countdown) => (countdown > 0 ? countdown - 1 : 0)),
      60000
    );
    return () => {
      clearInterval(id);
    };
  }, []);
  // Makes sure that the countdown is up to date
  useEffect(() => {
    setCountown(
      data.game ? parseInt((data.game.gameStart - Date.now() / 1000) / 60) : 0
    );
  }, [data]);
  let background = "black";
  if (Object.keys(data).length > 0) {
    // Changes the background to the correct color if the player is missing or not known if they are coming
    if (data.forecast == "u") {
      background = "rgb(50, 50, 0)";
    } else if (data.forecast == "m") {
      background = "rgb(50, 0, 0)";
    }
    // Checks if the player exists
    if (data.exists === 0) {
      background = "rgb(91, 30, 50)";
    }
    // Checks if the player has a picture url set
    if (pictureUrl === undefined) {
      setPictureUrl(data.pictureUrl);
    }
    return (
      <div className={playerStyles.container} style={{ background }}>
        <div style={{ width: "min(10%, 80px)", textAlign: "center" }}>
          <p>{data.club}</p>
          <p>{data.position}</p>
        </div>
        <Image
          alt=""
          onError={() => {
            // If the picture does not exist a fallback picture is used
            setPictureUrl(fallbackImg);
          }}
          src={pictureUrl}
          width="130px"
          height="130px"
        />
        <div style={{ width: "70%" }}>
          <p>
            {data.name}
            {starred ? (
              <Image alt="starred" src="/star.svg" width="20px" height="20px" />
            ) : (
              ""
            )}
            {extraText && <i> {extraText}</i>}
            {data.updateRunning === false && (
              <Link href="/error/no-update">
                <a style={{ color: "red" }}>
                  {" "}
                  Player Data not updating click for details
                </a>
              </Link>
            )}
          </p>
          <div className={playerStyles.innerContainer}>
            <div>
              <p>Total</p>
              <p>{data.total_points}</p>
            </div>
            <div>
              <p>Average</p>
              <p>{data.average_points}</p>
            </div>
            <div>
              <p>Last</p>
              <p>
                {data.last_match}
                {starred ? " X Star" : ""}
              </p>
            </div>
            <div>
              <p>Value</p>
              <p>{data.value / 1000000} M</p>
            </div>
            {data.game && (
              <div>
                <p>Next</p>
                <p>
                  {data.game.opponent}
                  {countdown > 0
                    ? ` in ${Math.floor(countdown / 60 / 24)} D ${
                        Math.floor(countdown / 60) % 24
                      } H ${Math.floor(countdown) % 60} M`
                    : ""}
                </p>
              </div>
            )}
          </div>
        </div>
        <div
          className="playerButton"
          style={{
            width: "min(30%, 230px)",
            textAlign: "center",
          }}
        >
          {children}
        </div>
      </div>
    );
  } else {
    return (
      <div className={playerStyles.container}>
        <CircularProgress />
      </div>
    );
  }
}
// Used for the transfer screen
export function TransferPlayer({
  uid,
  ownership,
  money,
  league,
  transferData,
  transferLeft,
  open,
  duplicatePlayers,
  notify,
}) {
  const session = useSession();
  const user = session.data ? session.data.user.id : 1;
  const [data, setData] = useState({});
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      setData(await (await fetch(`/api/player/${uid}`)).json());
    }
    getData();
  }, [uid]);
  // Used to purchase a player
  function buySell() {
    notify("Buying/Selling");
    push(["trackEvent", "Purchase/Sell", String(league), String(uid)]);
    fetch(`/api/transfer/${league}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playeruid: uid,
      }),
    }).then(async (response) => {
      notify(await response.text(), response.ok ? "success" : "error");
      transferData();
    });
  }
  let PurchaseButton = (
    <Button variant="outlined" disabled={true}>
      Error Getting Player info
    </Button>
  );
  // Checks if the ownership info exists
  if (ownership !== undefined) {
    // Checks if the transfer market is still open
    if (!open) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          Transfer Market is Closed
        </Button>
      );
      // Checks if the user is already purchasing the player
    } else if (ownership.filter((e) => e.buyer === user).length > 0) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          Buying for{" "}
          {ownership.filter((e) => e.buyer === user)[0].amount / 1000000} M
        </Button>
      );
      // Checks if the user is already selling the player
    } else if (ownership.filter((e) => e.seller === user).length > 0) {
      PurchaseButton = (
        <Button variant="outlined" color="error" disabled={true}>
          Selling for{" "}
          {ownership.filter((e) => e.seller === user)[0].amount / 1000000} M
        </Button>
      );
      // Checks if ther user is out of transfers
    } else if (!transferLeft) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          No transfer left can&apos;t buy/sell
        </Button>
      );
      // Checks if the user owns the player and can sell the player
    } else if (ownership.filter((e) => e.owner === user).length > 0) {
      PurchaseButton = (
        <Button variant="outlined" color="error" onClick={buySell}>
          Sell for: {data.value / 1000000} M
        </Button>
      );
      // Checks if the player is still purchasable
    } else if (
      duplicatePlayers <= ownership.filter((e) => !e.transfer).length
    ) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          Player not for Sale
        </Button>
      );
      // Checks if the player can be bought from the market
    } else if (duplicatePlayers > ownership.length) {
      if (data.value > money) {
        PurchaseButton = (
          <Button variant="outlined" disabled={true}>
            You need {data.value / 1000000} M
          </Button>
        );
      } else {
        PurchaseButton = (
          <Button variant="outlined" onClick={buySell}>
            Buy for {data.value / 1000000} M
          </Button>
        );
      }
      // Finds the cheapest market price and sets the purchase for that
    } else {
      let bestDeal = ownership
        .filter((e) => e.transfer)
        .sort((a, b) => a.amount - b.amount)[0];
      let cheapestPrice = bestDeal.amount + 100000;
      if (cheapestPrice > money) {
        PurchaseButton = (
          <Button variant="outlined" disabled={true}>
            You need {cheapestPrice / 1000000} M
          </Button>
        );
      } else {
        let outbidtext =
          bestDeal.buyer !== 0 ? (
            <>
              by outbidding <Username userid={bestDeal.buyer}></Username>{" "}
            </>
          ) : (
            <></>
          );
        PurchaseButton = (
          <Button variant="outlined" onClick={buySell}>
            Buy for {cheapestPrice / 1000000} M {outbidtext}
          </Button>
        );
      }
    }
  } else {
    // If no ownership data exists the player must not be owned by anyone
    if (!open) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          Transfer Market is Closed
        </Button>
      );
    } else if (!transferLeft) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          No transfer left can&apos;t buy
        </Button>
      );
      // Checks if the user owns the player and can sell the player
    } else if (data.value > money) {
      PurchaseButton = (
        <Button variant="outlined" disabled={true}>
          You need {data.value / 1000000} M
        </Button>
      );
    } else {
      PurchaseButton = (
        <Button variant="outlined" onClick={buySell}>
          Buy for {data.value / 1000000} M
        </Button>
      );
    }
  }
  return <InternalPlayer data={data}>{PurchaseButton}</InternalPlayer>;
}
// Used for the squad. Field should be undefined unless they are on the bench and then it shoud give what positions are still open
export function SquadPlayer({
  uid,
  update,
  field,
  league,
  starred,
  notify,
  status,
}) {
  const [data, setData] = useState({});
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      setData(await (await fetch(`/api/player/${uid}`)).json());
    }
    getData();
  }, [uid]);
  // Checks if the player is on the bench or not
  let MoveButton = "";
  let disabled = false;
  if (field === undefined) {
    MoveButton = "Move to Bench";
  } else {
    disabled = !field[data.position];
    MoveButton = !disabled ? "Move to Field" : "Position is Full";
    if (data.locked) {
      disabled = true;
      MoveButton = "Player has Already Played";
    }
  }
  let extraText;
  if (status == "buy") {
    extraText = "Buying";
  } else if (status == "sell") {
    extraText = "Selling";
  }
  return (
    <InternalPlayer data={data} starred={starred} extraText={extraText}>
      <Button
        variant="outlined"
        onClick={() => {
          notify("Moving");
          push(["trackEvent", "Move Player", league, uid]);
          // Used to move the player
          fetch(`/api/squad/${league}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerMove: [uid],
            }),
          })
            .then(async (response) => {
              notify(await response.text(), response.ok ? "success" : "error");
            })
            .then(update);
        }}
        disabled={disabled}
      >
        {MoveButton}
      </Button>
      {(starred === false || starred === 0) && !data.locked && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            notify("Starring");
            push(["trackEvent", "Star Player", league, uid]);
            fetch(`/api/squad/${league}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                star: [uid],
              }),
            })
              .then(async (response) => {
                notify(
                  await response.text(),
                  response.ok ? "success" : "error"
                );
              })
              .then(update);
          }}
        >
          Star
        </Button>
      )}
    </InternalPlayer>
  );
}
// Used to show the player without any buttons
export function Player({ uid, children, starred, notify }) {
  const [data, setData] = useState({});
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      setData(await (await fetch(`/api/player/${uid}`)).json());
    }
    getData();
  }, [uid]);
  return (
    <InternalPlayer data={data} starred={starred}>
      {" "}
      {children}
    </InternalPlayer>
  );
}
// Used to show the player with historical data
export function HistoricalPlayer({ uid, time, children, starred }) {
  const [data, setData] = useState({});
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      setData(await (await fetch(`/api/player/${uid}?time=${time}`)).json());
    }
    getData();
  }, [uid, time]);
  return (
    <InternalPlayer data={data} starred={starred}>
      {" "}
      {children}
    </InternalPlayer>
  );
}
