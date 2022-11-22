import { Alert, AlertTitle, Button, TextField, useTheme } from "@mui/material";
import { GetStaticProps } from "next";
import { OAuthProviderButtonStyles } from "next-auth/providers";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import Menu from "../components/Menu";
import { Providers, getProviders } from "../types/providers";
import Link from "../components/Link";
interface Props {
  enabledProviders: Providers[];
}

export default function SignIn({ enabledProviders }: Props) {
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
      logo: "https://raw.githubusercontent.com/nextauthjs/next-auth/main/packages/next-auth/provider-logos/google.svg",
      logoDark:
        "https://raw.githubusercontent.com/nextauthjs/next-auth/main/packages/next-auth/provider-logos/google.svg",
      bgDark: "#fff",
      bg: "#fff",
      text: "#000",
      textDark: "#000",
    });
  }
  if (enabledProviders.includes("github")) {
    providers.push({
      name: "github",
      logo: "https://raw.githubusercontent.com/nextauthjs/next-auth/main/packages/next-auth/provider-logos/github.svg",
      logoDark:
        "https://raw.githubusercontent.com/nextauthjs/next-auth/main/packages/next-auth/provider-logos/github-dark.svg",
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
        <title>Login Page</title>
      </Head>
      <Menu />
      {error && (
        <Alert
          severity={error === "CredentialsSignin" ? "warning" : "error"}
          className="notification"
        >
          <AlertTitle>
            {error === "CredentialsSignin"
              ? "Wrong Credentials"
              : "Failed to Sign in"}
          </AlertTitle>
          {error === "CredentialsSignin"
            ? "Check that you gave the correct username and password."
            : "Try logging in again."}
        </Alert>
      )}
      <div className="center">
        <>
          <h2>Login and Signup Here</h2>
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
              Sign in with {e.name}
            </Button>
          ))}
        </>
        <div style={{ height: "20px" }} />
        <TextField
          label="Username"
          type="text"
          id="username"
          variant="outlined"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          value={username}
        />
        <TextField
          label="Password"
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
          onClick={() => signIn("Sign In", { callbackUrl, username, password })}
        >
          Sign In
        </Button>
        <Button
          variant="contained"
          onClick={() => signIn("Sign Up", { callbackUrl, username, password })}
        >
          Sign Up
        </Button>
        <p>
          Note that by logging in or signing up you agree to the{" "}
          <Link href="privacy">privacy policy</Link>
        </p>
      </div>
    </>
  );
}
// Gets the list of providers
export const getStaticProps: GetStaticProps = async (ctx) => {
  const props: Props = { enabledProviders: getProviders() };
  return { props };
};
