import { signOut } from "next-auth/react";
import { ChangeEvent, Key, useContext, useState } from "react";
import Menu from "../components/Menu";
import Head from "next/head";
import {
  Button,
  Icon,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  useTheme,
} from "@mui/material";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { Session, getServerSession } from "next-auth";
import {
  NotifyContext,
  NotifyType,
  TranslateContext,
  UserContext,
} from "../Modules/context";
import { getProviders, Providers } from "../types/providers";
import connect from "../Modules/database";
import { useRouter } from "next/router";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
interface ProviderProps {
  provider: Providers;
  notify: NotifyType;
  user: Session["user"];
}
// Shows the ways to connect and disconnect from a provider
function ProviderShow({ provider, notify, user }: ProviderProps) {
  const t = useContext(TranslateContext);
  const [email, setEmail] = useState(user[provider]);
  const [input, setInput] = useState("");
  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setInput(e.target.value);
  }
  // Used to connect to the provider
  function connect() {
    notify(t("Connecting to {provider}", { provider }));
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
      notify(
        t(await response.text(), { provider }),
        response.ok ? "success" : "error"
      );
      setEmail(input);
    });
  }
  // Used to disconnect from the provider
  function disconnect() {
    notify(t(`Disconnecting from {provider}`, { provider }));
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
      notify(
        t(await response.text(), { provider }),
        response.ok ? "success" : "error"
      );
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
          label={t("Email")}
          value={input}
          onChange={handleInputChange}
          helperText={t(`Email used with {provider}`, { provider })}
        />
        <Button onClick={connect} variant="outlined">
          {t("Connect to {provider}", { provider })}
        </Button>
      </>
    );
  } else {
    return (
      <>
        <br></br>
        <Button variant="outlined" onClick={disconnect}>
          {t("Disconnect from {provider}", { provider })}
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
  const t = useContext(TranslateContext);
  const getUser = useContext(UserContext);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [passwordExists, setPasswordExists] = useState(user.password);
  const theme = useTheme();
  const notify = useContext(NotifyContext);
  const oppositeColor = theme.palette.mode === "dark" ? "light" : "dark";
  // Alternates the color mode
  function alternateColorMode() {
    setColorMode(oppositeColor, true);
    localStorage.theme = oppositeColor;
  }
  // Used to change the users username
  function changeUsername() {
    notify(t("Saving"));
    fetch(`/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      // Makes sure to update the username
      getUser(user.id, true);
    });
  }
  // Used to change the users password
  function changePassword() {
    notify(t("Saving"));
    fetch(`/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: password,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      setPasswordExists(password !== "");
    });
  }
  // Used to change the locale
  function changeLocale(event: SelectChangeEvent<string>) {
    let locale = event.target.value;
    notify(t("Saving"));
    fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: locale,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      localStorage.locale = locale;
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);
    });
  }
  // Used to delete the user
  const router = useRouter();
  function deleteUser() {
    notify(t("Deleting user"));
    fetch(`/api/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user.id,
      }),
    }).then(async (response) => {
      notify(t(await response.text()), response.ok ? "success" : "error");
      signOut();
    });
  }
  return (
    <>
      <Head>
        <title>{t("Usermenu")}</title>
      </Head>
      <Menu />
      <h1>{t("Usermenu")}</h1>
      <p>Your userID is {user.id}.</p>
      <Button variant="contained" onClick={alternateColorMode}>
        {t("Switch to {theme} mode", { theme: t(oppositeColor) })}{" "}
        <Icon>{oppositeColor + "_mode"}</Icon>
      </Button>
      <InputLabel htmlFor="locale">{t("Language")}</InputLabel>
      <Select value={router.locale} onChange={changeLocale} id="locale">
        {router.locales?.map((val) => (
          <MenuItem key={val} value={val}>
            {val}
          </MenuItem>
        ))}
      </Select>
      <br />
      <br />
      <TextField
        error={username === ""}
        id="username"
        variant="outlined"
        size="small"
        label={t("Username")}
        onChange={(e) => {
          // Used to change the username
          setUsername(e.target.value);
        }}
        value={username}
      />
      <Button variant="contained" onClick={changeUsername}>
        {t("Change Username")}
      </Button>
      <p>
        {t("Password Auth is currently {enabled}. ", {
          enabled: passwordExists ? t("enabled") : t("disabled"),
        })}
        {t(
          "It is recommended against using password authorization unless strictly necessary. "
        )}
      </p>
      <TextField
        type="password"
        id="password"
        variant="outlined"
        size="small"
        label={t("Password")}
        helperText={t("If empty this will disable password auth")}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <Button
        disabled={password === "" && !passwordExists}
        variant="contained"
        onClick={changePassword}
      >
        {password === "" ? t("Disable password auth") : t("Change password")}
      </Button>
      {!deleteable && (
        <p>
          {t("You can not be in any leagues if you want to delete your user. ")}
        </p>
      )}
      {deleteable && (
        <>
          <br></br>
          <Button onClick={deleteUser} color="error" variant="contained">
            {t("Delete user")} <Icon>delete</Icon>
          </Button>
        </>
      )}
      <h2>{t("OAuth Providers")}</h2>
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
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
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
