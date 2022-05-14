import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'

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
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Will make sure that if this was sign in with google only a valid user logged in.
      if (account.provider === "google") {
        if (! profile.email_verified) {
          return false
        }
        return await new Promise((resolve) => {
          var mysql = require('mysql');
          var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            });
          connection.query("SELECT email FROM users WHERE email=?", [profile.email], function(error, results, fields) {
            if (results.length == 0) {
              connection.query("INSERT INTO users VALUES (?, ?)", [profile.email, profile.email.slice(0, profile.email.search("@"))], function() {
                resolve(true)
              })
            } else {
              resolve(true)
            }
          })
        }).then((val) => {
          return val
        })
      }
      return true // Do different verification for other providers that don't have `email_verified`
    },
  }
}

export default (req, res) => NextAuth(req, res, options)