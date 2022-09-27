import playerStyles from "../styles/Player.module.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import { push } from "@socialgouv/matomo-next";
import { useSession } from "next-auth/react";
import fallbackImg from "../public/playerFallback.png";
import Link from "./Link";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import Dialog from "./Dialog";
import { UserChip } from "./Username";
// Used to create the layout for a player card that shows some simple details on a player just requires the data of the player to be passed into it and you can pass a custom button as a child of the component
// extraText is shown in parenthesis next to the player name
// condensed is which type of condensed view should be shown (transfer, squad, or historical)
function InternalPlayer({ data, children, starred, extraText, condensed }) {
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
      <div
        className={playerStyles.container}
        style={{ background, height: "120px" }}
      >
        <div style={{ width: "min(10%, 80px)", textAlign: "center" }}>
          <p>{data.club}</p>
          <p>{data.position}</p>
        </div>
        <Link styled={false} href={`/player/${data.uid}`}>
          <Image
            alt=""
            onError={() => {
              // If the picture does not exist a fallback picture is used
              setPictureUrl(fallbackImg);
            }}
            src={pictureUrl}
            width="100px"
            height="100px"
          />
        </Link>
        <div style={{ width: "70%" }}>
          <p>
            <Link styled={false} href={`/player/${data.uid}`}>
              {data.name}
            </Link>
            {starred ? (
              <Image alt="starred" src="/star.svg" width="20px" height="20px" />
            ) : (
              ""
            )}
            {extraText && <i> {extraText}</i>}
            {data.updateRunning === false && (
              <Link color={"#ff0000"} href="/error/no-update">
                Player Data not updating click for details
              </Link>
            )}
          </p>
          <Box
            className={playerStyles.innerContainer}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
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
                {starred && countdown == 0 ? " X Star" : ""}
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
          </Box>
          <Box
            className={playerStyles.innerContainer}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            {condensed == "transfer" && (
              <div>
                <p>Total</p>
                <p>{data.total_points}</p>
              </div>
            )}
            <div>
              <p>Average</p>
              <p>{data.average_points}</p>
            </div>
            <div>
              <p>Last</p>
              <p>
                {data.last_match}
                {starred && countdown == 0 ? " X Star" : ""}
              </p>
            </div>
            {condensed != "squad" && (
              <div>
                <p>Value</p>
                <p>{data.value / 1000000} M</p>
              </div>
            )}
            {data.game && (
              <div>
                <p>Next</p>
                <p>
                  {data.game.opponent}
                  {countdown > 0 && condensed == "squad"
                    ? ` in ${Math.floor(countdown / 60 / 24)}D ${
                        Math.floor(countdown / 60) % 24
                      }H ${Math.floor(countdown) % 60}M`
                    : ""}
                </p>
              </div>
            )}
          </Box>
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
  allOwnership,
}) {
  const session = useSession();
  const user = session.data ? session.data.user.id : -1;
  const [data, setData] = useState({});
  const [focused, setFocused] = useState(false);
  const [amount, setAmount] = useState(money);
  if (
    user !== -1 &&
    Object.values(allOwnership).filter(
      (e) => e.filter((e2) => e2.owner === user).length > 0
    ).length == 0
  )
    transferLeft = true;
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      const info = await (await fetch(`/api/player/${uid}`)).json();
      setData(info);
      setAmount(info.value / 1000000);
    }
    getData();
  }, [uid]);
  // Used to purchase a player
  function buySell(amount) {
    amount = amount * 1000000;
    setFocused(false);
    notify("Buying/Selling");
    push(["trackEvent", "Purchase/Sell", String(league), String(uid)]);
    fetch(`/api/transfer/${league}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playeruid: uid,
        amount,
      }),
    }).then(async (response) => {
      notify(await response.text(), response.ok ? "success" : "error");
      transferData();
    });
  }
  let ButtonText = "Error Getting Player info";
  let ButtonColor = "primary";
  const BuyText = (
    <>
      <TextField
        id="amount"
        variant="outlined"
        size="small"
        label="Max Purchase Amount"
        type="number"
        endadornment={<InputAdornment position="end">M</InputAdornment>}
        onChange={(val) => {
          // Used to change the invite link
          setAmount(val.target.value);
        }}
        value={amount}
      />
      <Button color="success" onClick={() => buySell(amount)}>
        Buy for max of {amount}
      </Button>
    </>
  );
  // This will contain the input for everything you can do
  let Actions = <></>;
  // Checks if the ownership info exists
  if (ownership !== undefined) {
    // Checks if the transfer market is still open
    if (!open) {
      ButtonText = "Transfer Market is Closed";
      // Checks if the user is already purchasing the player
    } else if (ownership.filter((e) => e.buyer === user).length > 0) {
      ButtonText = "Edit Purchase";
      ButtonColor = "success";
      Actions = (
        <>
          {BuyText}
          <Button
            color="secondary"
            onClick={() => {
              buySell(0);
            }}
          >
            Cancel Purchase
          </Button>
        </>
      );
      // Checks if the user is already selling the player
    } else if (ownership.filter((e) => e.seller === user).length > 0) {
      ButtonText = "View Sale";
      ButtonColor = "error";
      Actions = (
        <>
          <Button
            color="secondary"
            onClick={() => {
              buySell(0);
            }}
          >
            Cancel Sale
          </Button>
        </>
      );
      // Checks if ther user is out of transfers
    } else if (!transferLeft) {
      ButtonText = "View Transfers";
      // Checks if the user owns the player and can sell the player
    } else if (ownership.filter((e) => e.owner === user).length > 0) {
      ButtonText = "Sell";
      ButtonColor = "error";
      Actions = (
        <>
          <Button
            color="error"
            onClick={() => {
              buySell(data.value * -1);
            }}
          >
            Sell
          </Button>
        </>
      );
      // Checks if the player is still purchasable
    } else if (
      duplicatePlayers <= ownership.filter((e) => !e.transfer).length
    ) {
      ButtonText = "View Transfers";
      // Checks if the player can be bought from the market
    } else if (duplicatePlayers > ownership.length) {
      if (data.value > money) {
        ButtonText = "View Transfers";
      } else {
        ButtonText = "Buy";
        ButtonColor = "success";
        Actions = BuyText;
      }
      // Finds the cheapest market price and sets the purchase for that
    } else {
      let bestDeal = ownership
        .filter((e) => e.transfer)
        .sort((a, b) => a.amount - b.amount)[0];
      let cheapestPrice = bestDeal.amount + 100000;
      if (cheapestPrice > money) {
        ButtonText = "View Transfers";
      } else {
        ButtonText = "Buy";
        ButtonColor = "success";
        Actions = BuyText;
      }
    }
  } else {
    // If no ownership data exists the player must not be owned by anyone
    if (!open) {
      ButtonText = "Transfer Market is Closed";
    } else if (!transferLeft) {
      ButtonText = "View Transfers";
      // Checks if the user owns the player and can sell the player
    } else if (data.value > money) {
      ButtonText = "View Transfers";
    } else {
      ButtonText = "Buy";
      ButtonColor = "success";
      Actions = BuyText;
    }
  }
  return (
    <InternalPlayer data={data} condensed={"transfer"}>
      <Dialog
        onClose={() => setFocused(false)}
        open={focused}
        title={data.name}
      >
        <strong>Transfers</strong>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Seller</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ownership &&
                ownership
                  .filter((e) => e.transfer)
                  .map((e) => (
                    <TableRow key={String(e.buyer + "plus" + e.seller)}>
                      <TableCell>
                        <UserChip userid={e.seller} />
                      </TableCell>
                      <TableCell>
                        <UserChip userid={e.buyer} />
                      </TableCell>
                      <TableCell>{e.amount / 1000000}M</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <strong>Owners</strong>
        {ownership &&
          ownership
            .filter((e) => !e.transfer)
            .map((e) => <UserChip key={e.owner} userid={e.owner} />)}
        {ownership &&
          ownership
            .filter((e) => e.seller != 0 && e.transfer)
            .map((e) => <UserChip key={e.seller} userid={e.seller} />)}
        {Actions}
      </Dialog>
      <Button
        variant="outlined"
        disabled={
          ButtonText === "Transfer Market is Closed" ||
          ButtonText === "Error Getting Player info"
        }
        color={ButtonColor}
        onClick={() => {
          setFocused(true);
        }}
      >
        {ButtonText}
      </Button>
    </InternalPlayer>
  );
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
    <InternalPlayer
      data={data}
      starred={starred}
      extraText={extraText}
      condensed={"squad"}
    >
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
export function Player({ uid, children, starred }) {
  const [data, setData] = useState({});
  // Used to get the data for the player
  useEffect(() => {
    async function getData() {
      setData(await (await fetch(`/api/player/${uid}`)).json());
    }
    getData();
  }, [uid]);
  return (
    <InternalPlayer data={data} starred={starred} condensed={"historical"}>
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
    <InternalPlayer data={data} starred={starred} condensed={"historical"}>
      {" "}
      {children}
    </InternalPlayer>
  );
}
