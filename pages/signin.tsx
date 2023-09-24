import { Alert, AlertTitle, Button, TextField, useTheme } from "@mui/material";
import { GetStaticProps } from "next";
import { OAuthProviderButtonStyles } from "next-auth/providers";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import Menu from "../components/Menu";
import { Providers, getProviders } from "../types/providers";
import Link from "../components/Link";
import { TranslateContext } from "../Modules/context";
import connect from "#/Modules/database";
import { getData } from "./api/theme";
interface Props {
  enabledProviders: Providers[];
  enablePasswordSignup: boolean;
}

export default function SignIn({
  enabledProviders,
  enablePasswordSignup,
}: Props) {
  const t = useContext(TranslateContext);
  const router = useRouter();
  const callbackUrl = router.query.callbackUrl as string;
  const error = router.query.error as string;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  interface providerData extends OAuthProviderButtonStyles {
    name: string;
  }
  const providers: providerData[] = [];
  // Gets the provider data so the button looks nice
  if (enabledProviders.includes("google")) {
    providers.push({
      name: "google",
      logo: "https://raw.githubusercontent.com/nextauthjs/next-auth/main/docs/static/img/providers/google.svg",
      logoDark:
        "https://raw.githubusercontent.com/nextauthjs/next-auth/main/docs/static/img/providers/google.svg",
      bgDark: "#fff",
      bg: "#fff",
      text: "#000",
      textDark: "#000",
    });
  }
  if (enabledProviders.includes("github")) {
    providers.push({
      name: "github",
      logo: "https://raw.githubusercontent.com/nextauthjs/next-auth/main/docs/static/img/providers/github.svg",
      logoDark:
        "https://raw.githubusercontent.com/nextauthjs/next-auth/main/docs/static/img/providers/github-dark.svg",
      bg: "#fff",
      bgDark: "#000",
      text: "#000",
      textDark: "#fff",
    });
  }
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  return (
    <>
      <Head>
        <title>{t("Login and Signup Page")}</title>
      </Head>
      <Menu />
      {error && (
        <Alert
          severity={error === "CredentialsSignin" ? "warning" : "error"}
          className="notification"
        >
          <AlertTitle>
            {error === "CredentialsSignin"
              ? t("Wrong Credentials")
              : error === "no_username"
              ? t("No Username or Password")
              : t("Failed to Sign in")}
          </AlertTitle>
          {error === "CredentialsSignin"
            ? t("Check that you entered the correct username and password. ")
            : error === "no_username"
            ? t("You need to give a username and a password when signing up. ")
            : t("Try logging in again. ")}
        </Alert>
      )}
      <div className="center">
        <>
          <h2>{t("Login and Signup Page")}</h2>
          {providers.map((e, idx) => (
            <Button
              startIcon={
                <Image
                  src={dark ? e.logoDark : e.logo}
                  height={20}
                  width={20}
                  alt=""
                />
              }
              key={idx}
              variant="contained"
              color="primary"
              sx={{
                background: dark ? e.bgDark : e.bg,
                color: dark ? e.textDark : e.text,
                margin: 1,
              }}
              onClick={() => signIn(e.name, { callbackUrl })}
            >
              {t("Sign in with {provider}", { provider: e.name })}
            </Button>
          ))}
        </>

        <p>
          {t(
            "It is recommended against using password authorization unless strictly necessary. ",
          )}
        </p>
        <div style={{ height: "20px" }} />
        <TextField
          label={t("Username")}
          type="text"
          id="username"
          variant="outlined"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          value={username}
        />
        <TextField
          label={t("Password")}
          type="password"
          id="password"
          variant="outlined"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          value={password}
        />
        <Button
          variant="contained"
          sx={{ margin: 0.5 }}
          onClick={() => signIn("Sign-In", { callbackUrl, username, password })}
        >
          {t("Sign In")}
        </Button>
        {enablePasswordSignup && (
          <Button
            variant="contained"
            onClick={() =>
              signIn("Sign-Up", { callbackUrl, username, password })
            }
          >
            {t("Sign Up")}
          </Button>
        )}
        <p>
          {" "}
          <Link href="privacy">
            {t(
              "Note that by logging in or signing up you agree to the privacy policy. ",
            )}
          </Link>
        </p>
      </div>
    </>
  );
}
// Gets the list of providers
export const getStaticProps: GetStaticProps = async (ctx) => {
  const connection = await connect();
  const props: Props = {
    enabledProviders: getProviders(),
    enablePasswordSignup:
      getProviders().length === 0 ||
      (await connection
        .query(
          "SELECT * FROM data WHERE value1='configEnablePasswordSignup' AND value2='1'",
        )
        .then((res) => res.length > 0)),
  };
  return {
    props: {
      ...props,
      t: await getData(ctx.locale),
    },
  };
};
