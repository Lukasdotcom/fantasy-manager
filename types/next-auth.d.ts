import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: number;
      username: string;
      password: boolean;
      throttle: number;
      active: Boolean;
      google: string;
      github: string;
      admin: Boolean;
      favoriteLeague: null | number;
    };
  }
}
