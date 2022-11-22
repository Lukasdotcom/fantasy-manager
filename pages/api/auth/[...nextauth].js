import NextAuth from "next-auth";
import connect from "../../../Modules/database";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

let ran = false;
const options = {
  pages: {
    signIn: "/signin",
  },
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // Used to sign in
      id: "Sign In",
      name: "Sign In",
      credentials: {
        username: { label: "Username", type: "username" },
        password: { label: "Password", type: "password" },
      },
      // Used to make sure that the credentails are correct
      authorize: async (credentials) => {
        const bcrypt = require("bcryptjs");
        // Goes through every user that has the email or username that was given and has password authentication enabled
        const connection = await connect();
        const users = await connection.query(
          "SELECT * FROM users WHERE username=? AND password!=''",
          [credentials.username]
        );
        const unthrottledUsers = users.filter((e) => e.throttle > 0);
        let finished = false;
        let result = null;
        unthrottledUsers.forEach((e) => {
          // Loops through every available user until the password is correct
          if (!finished) {
            // Checks if the password is correct
            if (bcrypt.compareSync(credentials.password, e.password)) {
              finished = true;
              result = { name: e.id };
            } else {
              // Lowers the throttle by 1
              connection.query(
                "UPDATE users SET throttle=throttle-1 WHERE id=?",
                [e.id]
              );
            }
          }
        });
        // Checks if all the users are throttled
        if (unthrottledUsers.length == 0 && users.length > 0) {
          users.forEach((e) => {
            console.log(`User id ${e.id} is locked`);
          });
          return "/error/locked";
        }
        connection.end();
        return Promise.resolve(result);
      },
    }),
    CredentialsProvider({
      // Used to sign up
      id: "Sign Up",
      name: "Sign Up",
      credentials: {
        username: { label: "Username", type: "username" },
        password: { label: "Password", type: "password" },
      },
      // Used to make sure that the credentails are correct
      authorize: async (credentials) => {
        const bcrypt = require("bcryptjs");
        // Goes through every user that has the email or username that was given
        const connection = await connect();
        const password = bcrypt.hashSync(
          credentials.password,
          parseInt(process.env.BCRYPT_ROUNDS)
        );
        await connection.query(
          "INSERT INTO users (username, password) VALUES(?, ?)",
          [credentials.username, password]
        );
        const users = await connection.query(
          "SELECT * FROM users WHERE (username=? AND password=?)",
          [credentials.username, password]
        );
        let result = null;
        if (users.length > 0) {
          result = {
            name: users[0].id,
          };
        }
        connection.end();
        return Promise.resolve(result);
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Will make sure that if this was sign in with google only a verified user logs in.
      if (account.provider === "google" || account.provider === "github") {
        const connection = await connect();
        // Checks if the user has already registered and if no then the user is created
        const registered = await connection
          .query(`SELECT * FROM users WHERE ${account.provider}=?`, [
            profile.email,
          ])
          .then((res) => res.length !== 0);
        if (!registered) {
          connection.query(
            `INSERT INTO users (${account.provider}, username, password) VALUES (?, ?, '')`,
            [profile.email, profile.name]
          );
        }
        connection.end();
        if (account.provider === "google") return profile.email_verified;
        return true;
      }
      return user;
    },
    async jwt({ token, account }) {
      // Makes sure that the id is in the name parameter
      if (account) {
        // Gets the id from the database
        if (account.provider === "google" || account.provider === "github") {
          const connection = await connect();
          token.name = await connection
            .query(`SELECT id FROM users WHERE ${account.provider}=?`, [
              token.email,
            ])
            .then((res) => (res.length > 0 ? res[0].id : 0));
          connection.end();
        }
      }
      return token;
    },
    // Uses the users id and then returns the data for the user
    async session({ session }) {
      if (session && session.user.name) {
        const connection = await connect();
        connection.query("UPDATE users SET active=1 WHERE id=? AND active=0", [
          session.user.name,
        ]);
        session.user = await connection
          .query("SELECT * FROM users WHERE id=?", [session.user.name])
          .then((res) => (res.length > 0 ? res[0] : undefined));
        connection.end();
        if (session.user !== undefined) {
          session.user.password = session.user.password !== "";
          session.user.active = session.user.active == 1;
          session.user.admin = session.user.admin == 1;
          return session;
        }
      }
      return null;
    },
  },
};

export default async function authenticate(req, res) {
  if (ran === false) {
    // Only adds sign in with github and google if they are setup by the server owner
    if (
      !(process.env.GITHUB_ID === undefined || process.env.GITHUB_ID === "") &&
      !(
        process.env.GITHUB_SECRET === undefined ||
        process.env.GITHUB_SECRET === ""
      )
    ) {
      options.providers = [
        GithubProvider({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        }),
        ...options.providers,
      ];
    }
    if (
      !(process.env.GOOGLE_ID === undefined || process.env.GOOGLE_ID === "") &&
      !(
        process.env.GOOGLE_SECRET === undefined ||
        process.env.GOOGLE_SECRET === ""
      )
    ) {
      options.providers = [
        GoogleProvider({
          clientId: process.env.GOOGLE_ID,
          clientSecret: process.env.GOOGLE_SECRET,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
        }),
        ...options.providers,
      ];
    }
    ran = true;
  }
  await NextAuth(req, res, options);
}
