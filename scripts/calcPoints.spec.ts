import { beforeEach, describe, expect, it } from "vitest";
import connect from "#database";
import { calcStarredPoints } from "#scripts/calcPoints";
import { leagueUsers } from "#type/database";
import { mock } from "vitest-mock-extended";

describe("calcStarredPoints", async () => {
  const connection = await connect();
  beforeEach(async () => {
    await connection.query("DELETE FROM players");
    await connection.query("DELETE FROM squad");
  });
  it("no players", async () => {
    const user: leagueUsers = mock<leagueUsers>({});
    expect(await calcStarredPoints(user)).toBe(0);
  });
});
