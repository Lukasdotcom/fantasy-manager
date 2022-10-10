import Menu from "../components/Menu";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import Head from "next/head.js";
import { getSession } from "next-auth/react";
interface props {}
export default function Home({}: GetServerSidePropsResult<props>) {
  return (
    <>
      <Head>
        <title>Admin Panel</title>
      </Head>
      <Menu />
      <h1>Admin Panel</h1>
      <p>You are a site admin</p>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  ctx: GetServerSidePropsContext
) => {
  const user = await getSession(ctx);
  // Makes sure the user is logged in
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          ctx.resolvedUrl
        )}`,
        permanent: false,
      },
    };
  }
  if (user.user.admin) {
    return {
      props: {},
    };
  }
  return {
    notFound: true,
  };
};
