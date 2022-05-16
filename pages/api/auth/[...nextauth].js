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
        return profile.email_verified
      }
      return true // Do different verification for other providers that don't have `email_verified`
    },
  }
}

export default async function authenticate(req, res) {
  await NextAuth(req, res, options)
}