import { getSession } from "next-auth/react";
import { useState } from "react";
import Menu from "../components/Menu";
import Head from "next/head";
import { Button, TextField } from "@mui/material";
// A place to change your username and other settings
export default function Home({ session, user, notify }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  return (
    <>
      <Head>
        <title>Usermenu</title>
      </Head>
      <Menu session={session} />
      <h1>Usermenu</h1>
      <TextField
        error={username === ""}
        id="username"
        variant="outlined"
        size="small"
        label="Username"
        onChange={(e) => {
          // Used to change the username
          setUsername(e.target.value);
        }}
        value={username}
      />
      <Button
        variant="contained"
        onClick={() => {
          if (username !== "") {
            notify("Saving...");
            fetch(`/api/user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username,
              }),
            }).then(async (response) => {
              notify(await response.text(), response.ok ? "success" : "error");
            });
          } else {
            notify("You can not have an empty username", "warning");
          }
        }}
      >
        Change Username
      </Button>
      <br></br>
      <TextField
        type="password"
        id="password"
        variant="outlined"
        size="small"
        label="Password"
        helperText="If empty you can disable password auth"
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <Button
        variant="contained"
        onClick={() => {
          notify("Saving password");
          // Used to change the users password
          fetch(`/api/user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              password: password,
            }),
          }).then(async (response) => {
            notify(await response.text(), response.ok ? "success" : "error");
          });
        }}
      >
        {password === "" ? "Disable Password Auth" : "Update Password"}
      </Button>
    </>
  );
}
// Returns all the user data if logged in and if not logged in redirects to the login page
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session) {
    const user = session.user;
    return { props: { user } };
  } else {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          ctx.resolvedUrl
        )}`,
        permanent: false,
      },
    };
  }
}
