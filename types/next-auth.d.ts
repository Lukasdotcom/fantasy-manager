// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      active: boolean;
      google: string;
      github: string;
      admin: boolean;
      favoriteLeague: null | number;
      theme: string | null;
      locale: string | null;
    };
  }
}
