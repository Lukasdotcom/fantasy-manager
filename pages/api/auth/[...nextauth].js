import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { createConnection } from 'mysql';

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
            const connection = createConnection({
               host       : process.env.MYSQL_HOST,
               user       : "root",
               password : process.env.MYSQL_PASSWORD,
               database : process.env.MYSQL_DATABASE
            })
            // Checks if the user has already registered and if no then the user is created
            connection.query("SELECT * FROM users WHERE email=?", [profile.email], function(error, result, field) {
               if (result.length == 0){
                  connection.query("INSERT INTO users (email, username) VALUES (?, ?)", [profile.email, profile.email])
               }
               connection.end()
            })
            return profile.email_verified
         }
         return true // Do different verification for other providers that don't have `email_verified`
      },
      // Used to find the users id and username
      async session({session}) {
         if (!session) return Promise.resolve(session)
         if (!session.user) return Promise.resolve(session)
         const email = session.user.email
         const [id, username] = await new Promise((res, rej) => {
            const connection = createConnection({
               host       : process.env.MYSQL_HOST,
               user       : "root",
               password : process.env.MYSQL_PASSWORD,
               database : process.env.MYSQL_DATABASE
            })
            connection.query("SELECT * FROM users WHERE email=?", [email], function(error, result) {
               result.length > 0 ? res([result[0].id, result[0].username]) : ["", ""]
            })
            connection.end()
         })
         session.user = {
            id,
            username,
            email
         }
         return Promise.resolve(session)
      }

   }
}

export default async function authenticate(req, res) {
   await NextAuth(req, res, options)
}