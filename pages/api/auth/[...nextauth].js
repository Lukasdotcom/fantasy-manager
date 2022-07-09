import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { createConnection } from 'mysql';
import CredentialsProvider from "next-auth/providers/credentials"

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
            return new Promise((res) => {
               const bcrypt = require('bcryptjs');
               // Goes through every user that has the email or username that was given and has password authentication enabled
               const connection = createConnection({
                  host       : process.env.MYSQL_HOST,
                  user       : process.env.MYSQL_USER,
                  password : process.env.MYSQL_PASSWORD,
                  database : process.env.MYSQL_DATABASE
               })
               connection.query("SELECT * FROM users WHERE (email=? OR username=?) AND password!=''", [credentials.username, credentials.username], function(error, result) {
                  let finished = false
                  result.forEach(e => {
                     if (! finished) {
                        if (bcrypt.compareSync(credentials.password, e.password)) {
                           finished = true
                           res({email : e.id})
                        }
                     }
                  })
                  if (! finished) res(null)
               })
               connection.end()
            })
            
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
            return new Promise((res) => {
               const bcrypt = require('bcryptjs');
               // Goes through every user that has the email or username that was given
               const connection = createConnection({
                  host       : process.env.MYSQL_HOST,
                  user       : process.env.MYSQL_USER,
                  password : process.env.MYSQL_PASSWORD,
                  database : process.env.MYSQL_DATABASE
               })
               const password = bcrypt.hashSync(credentials.password, parseInt(process.env.BCRYPT_ROUNDS))
               connection.query("INSERT INTO users (username, password, email) VALUES(?, ?, '')", [credentials.username, password])
               connection.query("SELECT * FROM users WHERE (username=? AND password=?) AND email=''", [credentials.username, password], function(error, result) {
                  if (result.length > 0) {
                     res({email : result[0].id})
                  } else {
                     res(null)
                  }
               })
               connection.end()
            })
            
         },
      }),
   ],
   callbacks: {
      async signIn({ account, profile, user }) {
         // Will make sure that if this was sign in with google only a verified user loggs in.
         if (account.provider === "google") {
            const connection = createConnection({
               host       : process.env.MYSQL_HOST,
               user       : process.env.MYSQL_USER,
               password : process.env.MYSQL_PASSWORD,
               database : process.env.MYSQL_DATABASE
            })
            // Checks if the user has already registered and if no then the user is created
            connection.query("SELECT * FROM users WHERE email=?", [profile.email], function(error, result, field) {
               if (result.length == 0){
                  connection.query("INSERT INTO users (email, username, password) VALUES (?, ?, '')", [profile.email, profile.name])
               }
               connection.end()
            })
            return profile.email_verified
         }
         return user
      },
      // Used to find the users id and username
      async session({session}) {
         // Checks if the user is logged in
         if (!session) return Promise.resolve(session)
         if (!session.user) return Promise.resolve(session)
         // Checks if this is signed in through google or not
         if (parseInt(session.user.email) > 0) {
            // Normal sign in
            const id = session.user.email
            const [email, username] = await new Promise((res) => {
            const connection = createConnection({
               host       : process.env.MYSQL_HOST,
               user       : process.env.MYSQL_USER,
               password : process.env.MYSQL_PASSWORD,
               database : process.env.MYSQL_DATABASE
            })
            connection.query("SELECT * FROM users WHERE id=?", [id], function(error, result) {
               result.length > 0 ? res([result[0].email, result[0].username]) : res(["", ""])
            })
            connection.end()
            })
            if (username == "") return Promise.resolve(undefined)
            session.user = {
               id,
               username,
               email
            }
            return Promise.resolve(session)
         } else {
            // Sign in with google
            const email = session.user.email
            const [id, username] = await new Promise((res) => {
            const connection = createConnection({
               host       : process.env.MYSQL_HOST,
               user       : process.env.MYSQL_USER,
               password : process.env.MYSQL_PASSWORD,
               database : process.env.MYSQL_DATABASE
            })
            connection.query("SELECT * FROM users WHERE email=?", [email], function(error, result) {
               result.length > 0 ? res([result[0].id, result[0].username]) : res(["", ""])
            })
            connection.end()
            })
            if (id == "") return Promise.resolve(undefined)
            session.user = {
               id,
               username,
               email
            }
            return Promise.resolve(session)
         }
      }

   }
}

export default async function authenticate(req, res) {
   await NextAuth(req, res, options)
}