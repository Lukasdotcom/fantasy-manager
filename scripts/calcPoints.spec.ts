import connect from "../Modules/database";
import {
  calcHistoricalPredictionPoints,
  calcPredicitionPointsRaw,
  calcPredictionsPointsNow,
  calcStarredPoints,
  predictions_raw,
} from "./calcPoints";
import {
  leagueSettings,
  leagueUsers,
  points,
  predictions,
} from "../types/database";
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

describe("calcPredictionsPointsNow", () => {
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
    await calcPredictionsPointsNow(user);
    const prediction_list: predictions[] = await connection.query(
      "SELECT * FROM predictions WHERE leagueID=1 AND user=1",
    );
    for (let i = 0; i < prediction_list.length; i++) {
      expect(prediction_list[i].home).not.toBeNull();
      expect(prediction_list[i].away).not.toBeNull();
    }
    connection.end();
  });
});

describe("calcPredictionsPoints", () => {
  const defaultleagueSettings: leagueSettings = {
    leagueID: 1,
    leagueName: "test",
    archived: 0,
    startMoney: 0,
    transfers: 0,
    duplicatePlayers: 0,
    starredPercentage: 0,
    matchdayTransfers: false,
    fantasyEnabled: false,
    predictionsEnabled: true,
    top11: false,
    active: true,
    inActiveDays: 0,
    league: "league",
    predictExact: 5,
    predictDifference: 3,
    predictWinner: 1,
  };
  it("no predictions", () => {
    expect(calcPredicitionPointsRaw([], [], defaultleagueSettings));
  });
  it("Simple with exact, difference and winner", () => {
    const predictions: predictions_raw[] = [
      { home: 2, away: 2, club: "1" },
      { home: 5, away: 1, club: "2" },
      { home: 5, away: 1, club: "3" },
    ];
    const games: predictions_raw[] = [
      { home: 2, away: 2, club: "1" },
      { home: 3, away: 0, club: "2" },
      { home: 4, away: 0, club: "3" },
    ];
    expect(
      calcPredicitionPointsRaw(predictions, games, defaultleagueSettings),
    ).toBe(9);
  });
});

describe("calcHistoricalPredictionPoints", () => {
  const point_data: points = {
    leagueID: 1,
    user: 1,
    points: 0,
    fantasyPoints: 0,
    predictionPoints: 0,
    time: 1,
    matchday: 1,
    money: 0,
  };
  beforeEach(async () => {
    const connection = await connect();
    await connection.query("DELETE FROM leagueSettings");
    await connection.query("DELETE FROM historicalClubs");
    await connection.query(
      "INSERT INTO leagueSettings (leagueID, predictExact, league) VALUES (1, 10, 'league')",
    );
    await connection.query(
      "INSERT INTO historicalClubs (home, time, teamScore, opponentScore, club, league) VALUES (1, 1, 1, 1, 'test', 'league')",
    );
    await connection.query(
      "INSERT INTO leagueUsers (user, leagueID) VALUES (1, 1)",
    );
    connection.end();
  });
  it("no prediction", async () => {
    const connection = await connect();
    await connection.query("DELETE FROM historicalPredictions");
    expect(await calcHistoricalPredictionPoints(point_data)).toBe(0);
    connection.end();
  });
  it("one prediction", async () => {
    const connection = await connect();
    await connection.query("DELETE FROM historicalPredictions");
    await connection.query(
      "INSERT INTO historicalPredictions (user, leagueID, matchday, home, away, club) VALUES (1, 1, 1, 1, 1, 'test')",
    );
    expect(await calcHistoricalPredictionPoints(point_data)).toBe(10);
    connection.end();
  });
});
