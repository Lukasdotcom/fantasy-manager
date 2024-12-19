import connect from "../Modules/database";
import { calcPredictionsPoints, calcStarredPoints } from "./calcPoints";
import { leagueUsers, predictions } from "../types/database";
import { describe } from "@jest/globals";

describe("calcStarredPoints", () => {
  beforeEach(async () => {
    const connection = await connect();
    await connection.query("DELETE FROM players");
    await connection.query("DELETE FROM squad");
    connection.end();
  });
  it("no players", async () => {
    const user: leagueUsers = {
      user: 1,
      leagueID: 1,
      points: 0,
      money: 0,
      formation: "{}",
      fantasyPoints: 0,
      predictionPoints: 0,
      admin: false,
      tutorial: false,
    };
    expect(process.env["APP_ENV"]).toBe("test");
    expect(await calcStarredPoints(user)).toBe(0);
  });
});

describe("calcPredictionsPoints", () => {
  beforeEach(async () => {
    const connection = await connect();
    await connection.query("DELETE FROM predictions");
    await connection.query("DELETE FROM leagueSettings");
    connection.end();
  });
  it("no predictions with null", async () => {
    const connection = await connect();
    await connection.query(
      "INSERT INTO predictions (leagueID, user, club, league, home, away) VALUES (1, 1, 'test', 'league', NULL, NULL)",
    );
    await connection.query("INSERT INTO leagueSettings (leagueID) VALUES (1)");
    await connection.query(
      "INSERT INTO leagueUsers (user, leagueID) VALUES (1, 1)",
    );
    await connection.query(
      "INSERT INTO predictions (leagueID, user, club, league, home, away) VALUES (1, 1, 'test2', 'league', 1, NULL)",
    );
    const user: leagueUsers = {
      user: 1,
      leagueID: 1,
      points: 0,
      money: 0,
      formation: "{}",
      fantasyPoints: 0,
      predictionPoints: 0,
      admin: false,
      tutorial: false,
    };
    await calcPredictionsPoints(user);
    const prediction_list: predictions[] = await connection.query(
      "SELECT * FROM predictions WHERE leagueID=1 AND user=1",
    );
    console.log(prediction_list);
    for (let i = 0; i < prediction_list.length; i++) {
      expect(prediction_list[i].home).not.toBeNull();
      expect(prediction_list[i].away).not.toBeNull();
    }
    connection.end();
  });
});
