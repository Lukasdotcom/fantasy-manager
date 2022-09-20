import { getSession } from "next-auth/react";
import { useState } from "react";
import Menu from "../components/Menu";
import Head from "next/head";
import { Button, TextField } from "@mui/material";
// Shows the ways to connect and disconnect from a provider
function ProviderShow({ provider, notify, user }) {
  const [email, setEmail] = useState(user[provider]);
  const [input, setInput] = useState("");
  if (email === "") {
    return (
      <>
        <br></br>
        <TextField
          type="email"
          variant="outlined"
          size="small"
          label="Email"
          value={input}
          onChange={(e, val) => {
            setInput(val);
          }}
          helperText={`Email used with ${provider}`}
        />
        <Button
          onClick={() => {
            notify(`Connecting to ${provider}`);
            fetch(`/api/user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                provider,
                email: input,
              }),
            }).then(async (response) => {
              notify(await response.text(), response.ok ? "success" : "error");
              setEmail(input);
            });
          }}
          variant="outlined"
        >
          Connect to {provider}
        </Button>
      </>
    );
  } else {
    return (
      <>
        <br></br>
        <Button
          variant="outlined"
          onClick={() => {
            notify(`Disconnecting from ${provider}`);
            fetch(`/api/user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                provider,
                email: "",
              }),
            }).then(async (response) => {
              notify(await response.text(), response.ok ? "success" : "error");
              setInput("");
              setEmail("");
            });
          }}
        >
          Disconnect from {provider}
        </Button>
      </>
    );
  }
}
// A place to change your username and other settings
export default function Home({ user, notify, providers }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [passwordExists, setPasswordExists] = useState(user.password);
  return (
    <>
      <Head>
        <title>Usermenu</title>
      </Head>
      <Menu />
      <h1>Usermenu</h1>
      <p>
        Note it might take up to 1 minute for the Username to update for
        everyone
      </p>
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
      <p>
        Password Auth is currently {passwordExists ? "enabled" : "disabled"}
      </p>
      <p>
        It is recommended against using password authorization unless strictly
        neccessary.
      </p>
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
        disabled={password === "" && !passwordExists}
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
            setPasswordExists(password !== "");
          });
        }}
      >
        {password === "" ? "Disable Password Auth" : "Update Password"}
      </Button>
      <h2>OAuth Providers</h2>
      <p>
        Note: If you used an oauth provider before v1.5.1 you will be registered
        with both even if you only signed in with one.
      </p>
      {providers.map((provider) => (
        <ProviderShow
          key={provider}
          provider={provider}
          notify={notify}
          user={user}
        />
      ))}
    </>
  );
}
// Returns all the user data if logged in and if not logged in redirects to the login page
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session) {
    const user = session.user;
    // Checks what providers are supported
    let providers = [];
    if (
      !(process.env.GOOGLE_ID === undefined || process.env.GOOGLE_ID === "") &&
      !(
        process.env.GOOGLE_SECRET === undefined ||
        process.env.GOOGLE_SECRET === ""
      )
    ) {
      providers.push("google");
    }
    if (
      !(process.env.GITHUB_ID === undefined || process.env.GITHUB_ID === "") &&
      !(
        process.env.GITHUB_SECRET === undefined ||
        process.env.GITHUB_SECRET === ""
      )
    ) {
      providers.push("github");
    }
    return { props: { user, providers } };
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
