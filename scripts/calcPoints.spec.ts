import connect from "../Modules/database";
import { calcStarredPoints } from "./calcPoints";
import { leagueUsers } from "../types/database";
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
