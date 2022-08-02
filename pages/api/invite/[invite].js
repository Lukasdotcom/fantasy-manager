import { getSession } from "next-auth/react";
import connect from "../../../Modules/database.mjs";
// Used to join a league
export default async function handler(req, res) {
  const session = await getSession({ req });
  if (session) {
    const connection = await connect();
    // Checks if it is a valid invite
    let invite = await connection.query(
      "SELECT leagueID FROM invite WHERE inviteID=?",
      [req.query.invite]
    );
    // Checks if the invite exists
    if (invite.length == 0) {
      res.redirect(308, "/404").end();
      return;
    }
    invite = invite[0];
    // Gets the info for the league
    let leagueName = await connection.query(
      "SELECT * FROM leagueSettings WHERE leagueID=?",
      [invite.leagueID]
    );
    // Checks if the league exists
    if (leagueName.length > 0) {
      leagueName = leagueName[0].leagueName;
      // Checks if the user has already joined the league
      const leagueUsers = await connection.query(
        "SELECT * FROM leagueUsers WHERE leagueId=? and user=?",
        [invite.leagueID, session.user.id]
      );
      // Adds the user in the database if they have not joined yet
      if (leagueUsers.length == 0) {
        connection.query(
          "INSERT INTO leagueUsers (leagueID, user, points, money, formation) VALUES(?, ?, 0, (SELECT startMoney FROM leagueSettings WHERE leagueId=?), '[1, 4, 4, 2]')",
          [invite.leagueID, session.user.id, invite.leagueID]
        );
        // Makes sure to add 0 point matchdays for every matchday that has already happened.
        await connection
          .query(
            "SELECT * FROM points WHERE leagueID=? ORDER BY points DESC",
            [invite.leagueID]
          )
          .then(async (point) => {
            let matchday = 0;
            if (point.length > 0) {
              matchday = point[0].matchday;
            }
            while (matchday > 0) {
              const time = point.filter((a) => a.matchday === matchday)
              connection.query(
                "INSERT INTO points (leagueID, user, points, matchday, time) VALUES(?, ?, 0, ?, ?)",
                [invite.leagueID, session.user.id, matchday, time.length > 0 ? time[0].time : 0]
              );
              matchday--;
            }
            console.log(
              `Player ${session.user.id} joined league ${invite.leagueID}`
            );
          });
      }
      res.redirect(308, `/${invite.leagueID}`).end();
    } else {
      console.error("Error occured with invite link");
      res
        .status(500)
        .end("An error occured please contact the website administrator");
    }
    connection.end();
  } else {
    // Redirects the user if they are not logged in
    res
      .redirect(
        307,
        `/api/auth/signin?callbackUrl=${encodeURIComponent(
          process.env.NEXTAUTH_URL + "/api/invite/" + req.query.invite
        )}`
      )
      .end();
  }
}
