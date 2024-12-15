// // jest.config.js
// module.exports = {
//   testEnvironment: "node",
//   testMatch: ["<rootDir>/scripts/**/*.spec.ts"],
//   setupFilesAfterEnv: ["<rootDir>/scripts/setupDB.ts"],
// };

import type { Config } from "jest";

const config: Config = {
  verbose: true,
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
};

export default config;
