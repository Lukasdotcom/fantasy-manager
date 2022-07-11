import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { useEffect, useState } from "react";
import Username from "../../components/Username";
import { push } from "@socialgouv/matomo-next";
import { getSession } from "next-auth/react";

// Creates the admin panel
function AdminPanel({ user, league }) {
  const [startingMoney, setStartingMoney] = useState(150);
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState(6);
  const [duplicatePlayers, setDuplicatePlayers] = useState(1);
  function updateData(league) {
    fetch(`/api/league/${league}`).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        setStartingMoney(result.settings.startMoney / 1000000);
        setUsers(result.users);
        setTransfers(result.settings.transfers);
        setDuplicatePlayers(result.settings.duplicatePlayers);
      } else {
        alert(await res.text());
      }
    });
  }
  useEffect(() => {
    updateData(league);
  }, [league]);
  return (
    <>
      <h1>Admin Panel</h1>
      <label htmlFor="startingMoney">
        Money players will start with in millions:
      </label>
      <input
        id="startingMoney"
        value={startingMoney}
        type="number"
        onChange={(val) => {
          setStartingMoney(val.target.value);
        }}
      ></input>
      <br />
      <label htmlFor="transfers">Amount of transfers per transfer time:</label>
      <input
        id="transfers"
        value={transfers}
        type="number"
        onChange={(val) => {
          setTransfers(val.target.value);
        }}
      ></input>
      <br />
      <label htmlFor="duplicatePlayers">
        Amount of times a player can be in a squad in the league:
      </label>
      <input
        id="duplicatePlayers"
        value={duplicatePlayers}
        type="number"
        onChange={(val) => {
          setDuplicatePlayers(val.target.value);
        }}
      ></input>
      <h2>Check Users for Admin</h2>
      {users.map((element, id) => {
        // Checks if this is the actual user
        if (element.user != user) {
          return (
            <div key={id}>
              <Username key={id} id={element.user} />
              <input
                type="checkbox"
                checked={element.admin == 1}
                onChange={(e) => {
                  setUsers((e2) => {
                    e2[id].admin = e.target.checked ? 1 : 0;
                    return [...e2];
                  });
                }}
              ></input>
              <br></br>
            </div>
          );
        } else {
          return <div key={id}></div>;
        }
      })}
      <br></br>
      <button
        onClick={() => {
          // Used to save the data
          fetch(`/api/league/${league}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              users,
              settings: {
                startingMoney: startingMoney * 1000000,
                transfers,
                duplicatePlayers,
              },
            }),
          }).then(async (res) => {
            if (!res.ok) alert(await res.text());
            updateData(league);
          });
        }}
      >
        Save all Admin Settings
      </button>
    </>
  );
}
// Shows some simple UI for each user in the table
function User({ name, points }) {
  return (
    <tr>
      <td>
        <Username id={name} />
      </td>
      <td>{points}</td>
    </tr>
  );
}
// Used to show all the invites that exist and to delete an individual invite
function Invite({ link, league, host, remove }) {
  return (
    <p>
      Link: {`${host}/api/invite/${link}`}
      <button
        onClick={async () => {
          push(["trackEvent", "Delete Invite", league, link]);
          await fetch("/api/invite", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leagueID: league,
              link: link,
            }),
          });
          remove();
        }}
        className="red-button"
      >
        Delete
      </button>
    </p>
  );
}
export default function Home({
  user,
  admin,
  session,
  league,
  standings,
  historicalPoints,
  inviteLinks,
  host,
}) {
  // Calculates the current matchday
  if (Object.values(historicalPoints).length == 0) {
    var currentMatchday = 0;
  } else {
    var currentMatchday = Object.values(historicalPoints)[0].length;
  }
  const [matchday, setmatchday] = useState(currentMatchday + 1);
  const [invites, setInvites] = useState(inviteLinks);
  const [newInvite, setnewInvite] = useState("");
  // Orders the players in the correct order by points
  if (matchday <= currentMatchday) {
    standings = [];
    Object.keys(historicalPoints).forEach((e) => {
      standings.push({ user: e, points: historicalPoints[e][matchday] });
    });
    standings.sort((a, b) => a.points - b.points);
  }
  return (
    <>
      <Head>
        <title>Standings</title>
      </Head>
      <Menu session={session} league={league} />
      <h1>Standings</h1>
      <table>
        <tbody>
          <tr>
            <th>User</th>
            <th>
              {matchday > currentMatchday
                ? "Total Points"
                : `Matchday ${matchday} Points`}
            </th>
          </tr>
          {standings.map((val) => (
            <User
              name={val.user}
              key={val.user}
              points={
                matchday > currentMatchday
                  ? val.points
                  : historicalPoints[val.user][matchday - 1]
              }
            />
          ))}
        </tbody>
      </table>
      <br></br>
      {matchday !=
        0 /* This is to allow the user to input a matchday to show the number of points */ && (
        <>
          <label htmlFor="matchday">
            Drag this to show points for a specific matchday. If all the way on
            the right total points will be shown
          </label>
          <br></br>
          <input
            id="matchday"
            type={"range"}
            min={1}
            max={currentMatchday + 1}
            value={matchday}
            onChange={(e) => {
              setmatchday(e.target.value);
            }}
          ></input>
        </>
      )}
      <h1>Invite Links</h1>
      {invites.map((val) => (
        <Invite
          host={host}
          key={val}
          link={val}
          league={league}
          remove={() => {
            setInvites(invites.filter((e) => e != val));
          }}
        />
      ))}
      {/* Used to create a new invite link */}
      <label htmlFor="invite">
        Enter Custom Invite Link Here(Leave empty for a random invite link):{" "}
      </label>
      <input
        onChange={(val) => {
          setnewInvite(val.target.value);
        }}
        val={newInvite}
        id="invite"
      ></input>
      <button
        onClick={() => {
          let link = newInvite;
          // Makes sure to generate a random leagueID if none is given
          if (link === "") {
            link = String(Math.random()).slice(2);
          }
          fetch("/api/invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leagueID: league,
              link: link,
            }),
          }).then((response) => {
            if (response.ok) {
              push(["trackEvent", "Create Invite", league, link]);
              setInvites([...invites, link]);
            } else {
              alert("Invite link already used");
            }
          });
        }}
      >
        Add Invite
      </button>
      {admin && <AdminPanel user={user} league={league} />}
    </>
  );
}

// Gets the users session
export async function getServerSideProps(ctx) {
  // Gets the user id
  const session = await getSession(ctx);
  const user = session ? session.user.id : -1;
  // Gets the leaderboard for the league
  const standings = new Promise((resolve) => {
    const mysql = require("mysql");
    var connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    connection.query(
      "SELECT user, points FROM leagueUsers WHERE leagueId=?",
      [ctx.params.league],
      function (error, results, fields) {
        connection.end();
        resolve(results);
      }
    );
  }).then((val) =>
    JSON.parse(JSON.stringify(val.sort((a, b) => b.points - a.points)))
  );
  // Gets the historical amount of points for every matchday in the league
  const historicalPoints = new Promise((resolve) => {
    const mysql = require("mysql");
    var connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    connection.query(
      "SELECT user, points, matchday FROM points WHERE leagueId=? ORDER BY matchday ASC",
      [ctx.params.league],
      function (error, results, fields) {
        connection.end();
        // Reformats the result into a dictionary that has an entry for each user and each entry for that user is an array of all the points the user has earned in chronological order.
        if (results.length > 0) {
          let points = {};
          results.forEach((element) => {
            if (points[element.user]) {
              points[element.user].push(element.points);
            } else {
              points[element.user] = [element.points];
            }
          });
          resolve(points);
        } else {
          resolve({});
        }
      }
    );
  }).then((val) => JSON.parse(JSON.stringify(val)));
  const inviteLinks = new Promise((resolve) => {
    // Gets an array of invite links for this league
    const mysql = require("mysql");
    var connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    connection.query(
      "SELECT inviteID FROM invite WHERE leagueId=?",
      [ctx.params.league],
      function (error, results, fields) {
        connection.end();
        // Turns the result into a list of valid invite links
        let inviteLinks = [];
        results.forEach((val) => {
          inviteLinks.push(val.inviteID);
        });
        resolve(inviteLinks);
      }
    );
  }).then((val) => JSON.parse(JSON.stringify(val)));
  // Checks if the user is an admin
  const admin = new Promise(async (res) => {
    const mysql = require("mysql");
    const connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    connection.query(
      "SELECT admin FROM leagueUsers WHERE admin=1 AND leagueID=? AND user=?",
      [ctx.params.league, user],
      function (error, result, field) {
        res(result.length > 0);
      }
    );
  });
  return await redirect(ctx, {
    user,
    admin: await admin,
    standings: await standings,
    historicalPoints: await historicalPoints,
    inviteLinks: await inviteLinks,
    host: ctx.req.headers.host,
  });
}
