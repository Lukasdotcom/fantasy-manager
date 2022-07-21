import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connect from "../../../Modules/database.mjs";
import CredentialsProvider from "next-auth/providers/credentials";

const options = {
  // Configure one or more authentication providers
  providers: [
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
        const users = connection.query(
          "SELECT * FROM users WHERE (email=? OR username=?) AND password!=''",
          [credentials.username, credentials.username]
        );
        let finished = false;
        let result = null;
        users.forEach((e) => {
          if (!finished) {
            if (bcrypt.compareSync(credentials.password, e.password)) {
              finished = true;
              result = { email: e.id };
            }
          }
        });
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
        connection.query(
          "INSERT INTO users (username, password, email) VALUES(?, ?, '')",
          [credentials.username, password]
        );
        const users = await connection.query(
          "SELECT * FROM users WHERE (username=? AND password=?) AND email=''",
          [credentials.username, password]
        );
        let result = null;
        if (users.length > 0) {
          result = { email: users[0].id };
        }
        connection.end();
        return Promise.resolve(result);
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Will make sure that if this was sign in with google only a verified user loggs in.
      if (account.provider === "google") {
        const connection = await connect();
        // Checks if the user has already registered and if no then the user is created
        const registered = connection
          .query("SELECT * FROM users WHERE email=?", [profile.email])
          .then((res) => res.length !== 0);
        if (!registered) {
          connection.query(
            "INSERT INTO users (email, username, password) VALUES (?, ?, '')",
            [profile.email, profile.name]
          );
        }
        connection.end();
        return profile.email_verified;
      }
      return user;
    },
    // Used to find the users id and username
    async session({ session }) {
      // Checks if the user is logged in
      if (!session) return Promise.resolve(session);
      if (!session.user) return Promise.resolve(session);
      // Checks if this is signed in through google or not
      if (parseInt(session.user.email) > 0) {
        const connection = await connect();
        // Normal sign in
        const id = session.user.email;
        const [email, username] = await connection
          .query("SELECT * FROM users WHERE id=?", [id])
          .then((result) => {
            if (result.length > 0) {
              return [result[0].email, result[0].username];
            } else {
              return ["", ""];
            }
          });
        connection.end();
        if (username == "") return Promise.resolve(undefined);
        session.user = {
          id,
          username,
          email,
        };
        return Promise.resolve(session);
      } else {
        // Sign in with google
        const email = session.user.email;
        const connection = await connect();
        const [id, username] = connection
          .query("SELECT * FROM users WHERE email=?", [email])
          .then((result) => {
            if (result.length > 0) {
              return [result[0].email, result[0].username];
            } else {
              return ["", ""];
            }
          });
        connection.end();
        if (id == "") return Promise.resolve(undefined);
        session.user = {
          id,
          username,
          email,
        };
        return Promise.resolve(session);
      }
    },
  },
};

export default async function authenticate(req, res) {
  await NextAuth(req, res, options);
}
