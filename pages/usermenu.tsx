import { getSession } from "next-auth/react";
import { ChangeEvent, Key, useContext, useState } from "react";
import Menu from "../components/Menu";
import Head from "next/head";
import { Button, Icon, TextField, useTheme } from "@mui/material";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { Session } from "next-auth";
import { NotifyContext, NotifyType, UserContext } from "../Modules/context";
import { getProviders, Providers } from "../types/providers";
import connect from "../Modules/database";
import { useRouter } from "next/router";
interface ProviderProps {
  provider: Providers;
  notify: NotifyType;
  user: Session["user"];
}
// Shows the ways to connect and disconnect from a provider
function ProviderShow({ provider, notify, user }: ProviderProps) {
  const [email, setEmail] = useState(user[provider]);
  const [input, setInput] = useState("");
  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setInput(e.target.value);
  }
  // Used to connect to the provider
  function connect() {
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
  }
  // Used to disconnect from the provider
  function disconnect() {
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
  }
  // Checks if connected or not
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
          onChange={handleInputChange}
          helperText={`Email used with ${provider}`}
        />
        <Button onClick={connect} variant="outlined">
          Connect to {provider}
        </Button>
      </>
    );
  } else {
    return (
      <>
        <br></br>
        <Button variant="outlined" onClick={disconnect}>
          Disconnect from {provider}
        </Button>
      </>
    );
  }
}
// A place to change your username and other settings
export default function Home({
  user,
  providers,
  setColorMode,
  deleteable,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const getUser = useContext(UserContext);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [passwordExists, setPasswordExists] = useState(user.password);
  const theme = useTheme();
  const notify = useContext(NotifyContext);
  const oppositeColor = theme.palette.mode === "dark" ? "light" : "dark";
  // Alternates the color mode
  function alternateColorMode() {
    setColorMode(oppositeColor);
    localStorage.theme = oppositeColor;
  }
  // Used to change the users username
  function changeUsername() {
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
        // Makes sure to update the username
        getUser(user.id, true);
      });
    } else {
      notify("You can not have an empty username", "warning");
    }
  }
  // Used to change the users password
  function changePassword() {
    notify("Saving password");
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
  }
  // Used to delete the user
  const router = useRouter();
  function deleteUser() {
    notify("Deleting user");
    fetch(`/api/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user.id,
      }),
    }).then(async (response) => {
      notify(await response.text(), response.ok ? "success" : "error");
      router.push("/");
    });
  }
  return (
    <>
      <Head>
        <title>Usermenu</title>
      </Head>
      <Menu />
      <h1>Usermenu</h1>
      <Button variant="contained" onClick={alternateColorMode}>
        Switch to {oppositeColor} mode <Icon>{oppositeColor + "_mode"}</Icon>
      </Button>
      <p>Note that a username change will not instantly update.</p>
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
      <Button variant="contained" onClick={changeUsername}>
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
        onClick={changePassword}
      >
        {password === "" ? "Disable Password Auth" : "Update Password"}
      </Button>
      {!deleteable && (
        <p>You can not be in any leagues if you want to delete your user.</p>
      )}
      {deleteable && (
        <>
          <br></br>
          <Button onClick={deleteUser} color="error" variant="contained">
            Delete User <Icon>delete</Icon>
          </Button>
        </>
      )}
      <h2>OAuth Providers</h2>
      <p>
        Note: If you used an oauth provider before v1.5.1 you will be registered
        with both even if you only signed in with one.
      </p>
      {providers.map((provider: Providers) => (
        <ProviderShow
          key={provider as Key}
          provider={provider}
          notify={notify}
          user={user}
        />
      ))}
    </>
  );
}
// Returns all the user data if logged in and if not logged in redirects to the login page
export const getServerSideProps: GetServerSideProps = async (
  ctx: GetServerSidePropsContext
) => {
  const session = await getSession(ctx);
  if (session) {
    const connection = await connect();
    const user = session.user;
    // Checks if the user is in any leagues
    const anyLeagues = connection
      .query("SELECT * FROM leagueUsers WHERE user=? LIMIT 1", [user.id])
      .then((e) => e.length > 0);
    // Checks what providers are supported
    return {
      props: {
        user,
        providers: getProviders(),
        deleteable: !(await anyLeagues),
      },
    };
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
};
