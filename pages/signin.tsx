import { Alert, AlertTitle, Button, TextField, useTheme } from "@mui/material";
import { GetStaticProps } from "next";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import Menu from "../components/Menu";
import { Providers, getProviders } from "../types/providers";
import Link from "../components/Link";
import { TranslateContext } from "../Modules/context";
import { getData } from "./api/theme";
interface providerData {
  name: string;
  logo: string;
  logoDark: string;
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
}
/**
 * Retrieves the details of the enabled providers.
 *
 * @param {Providers[]} enabledProviders - An array of enabled providers.
 * @return {providerData[]} An array of styling data representing the enabled providers.
 */
export function getProviderDetails(
  enabledProviders: Providers[],
): providerData[] {
  const providers: providerData[] = [];
  // Gets the provider data so the button looks nice
  if (enabledProviders.includes("google")) {
    providers.push({
      name: "google",
      logo: "/providers/google.svg",
      logoDark: "/providers/google.svg",
      bg: "#fff",
      bgDark: "#000",
      text: "#000",
      textDark: "#fff",
    });
  }
  if (enabledProviders.includes("github")) {
    providers.push({
      name: "github",
      logo: "/providers/github-dark.svg",
      logoDark: "/providers/github-light.svg",
      bg: "#fff",
      bgDark: "#24292f",
      text: "#000",
      textDark: "#fff",
    });
  }
  return providers;
}

interface Props {
  enabledProviders: Providers[];
}
export default function SignIn({ enabledProviders }: Props) {
  const t = useContext(TranslateContext);
  const router = useRouter();
  const callbackUrl = router.query.callbackUrl as string;
  const error = router.query.error as string;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const providers = getProviderDetails(enabledProviders);
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  return (
    <>
      <Head>
        <title>{t("Login Page")}</title>
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
              ? t(
                  "You need to give a username and a password when signing up. ",
                )
              : t("Try logging in again. ")}
        </Alert>
      )}
      <div className="center">
        <>
          <h2>{t("Login Page")}</h2>
          <p>
            <Link
              href={`signup${
                typeof router.query.callbackUrl === "string"
                  ? "?callbackUrl=" +
                    encodeURIComponent(router.query.callbackUrl)
                  : ""
              }`}
            >
              {t("Click here for creating an account. ")}
            </Link>
          </p>
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
                "&:hover": {
                  background: dark ? e.bgDark : e.bg,
                },
                color: dark ? e.textDark : e.text,
                margin: 1,
              }}
              onClick={() => signIn(e.name, { callbackUrl })}
            >
              {t("Sign in with {provider}", { provider: e.name })}
            </Button>
          ))}
        </>
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
          sx={{ margin: 2 }}
          onClick={() => signIn("Sign-In", { callbackUrl, username, password })}
        >
          {t("Sign In")}
        </Button>
        <p>
          <Link href="privacy">
            {t("Note that by logging in you agree to the privacy policy. ")}
          </Link>
        </p>
      </div>
    </>
  );
}
// Gets the list of providers
export const getStaticProps: GetStaticProps = async (ctx) => {
  return {
    props: {
      enabledProviders: getProviders(),
      t: await getData(ctx),
    },
  };
};
