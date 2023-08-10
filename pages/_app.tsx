import "../styles/globals.css";
import { useEffect, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Alert,
  Snackbar,
  CssBaseline,
  GlobalStyles,
  Backdrop,
  CircularProgress,
  useMediaQuery,
  AlertColor,
} from "@mui/material";
import { useRouter } from "next/router";
import { AppProps } from "next/app";
import {
  NotifyContext,
  UserContext,
  TranslateContext,
} from "../Modules/context";
import getLocales from "../locales/getLocales";
import Head from "next/head";
interface Notification {
  message?: string;
  severity?: AlertColor;
}
const userData: { [key: number]: string } = {};
function MyApp({ Component, pageProps }: AppProps) {
  const { data: session } = useSession();
  const [translationData, setTranslationData] = useState<
    Record<string, string>
  >(pageProps.t ? pageProps.t : {});
  const [notifications, setNotifications] = useState<Notification>({});
  // Used to send notification
  function notify(message: string, severity: AlertColor = "info") {
    setNotifications({
      message: message,
      severity: severity,
    });
  }
  // Gets the username asyncronously
  async function getUser(id: number, reset = false): Promise<string> {
    if (!userData[id] || reset) {
      const data = await fetch(`/api/user/${id}`).then((e) => e.json());
      userData[id] = data;
    }
    return userData[id];
  }
  const router = useRouter();
  // Grabs the translations if required
  useEffect(() => {
    // If the user is logged in the locale is saved to local storage
    if (session && session.user.locale) {
      localStorage.locale = session.user.locale;
    }
    const findLocale = async () => {
      // Requests the locale if it is not set by testing on the main page
      if (!localStorage.locale) {
        const data = (await fetch("/")).url.split("/").pop();
        if (router.locales?.includes(String(data))) {
          localStorage.locale = data;
        } else {
          localStorage.locale = "en";
        }
      }
      // If the locale that is wanted is different then the one requested a redirect happens.
      if (
        router.locale !== localStorage.locale &&
        router.locales?.includes(localStorage.locale)
      ) {
        router.push(
          {
            pathname: router.pathname,
            query: router.query,
          },
          undefined,
          {
            locale: localStorage.locale,
          },
        );
        return;
      }
      const downloadTranslations = async (locale: string) => {
        const data = await getLocales(locale);
        setTranslationData(data ? data : {});
      };
      // Downloads the text data if it is needed
      if (router.locale === "en") {
        if (Object.values(translationData).length !== 0) {
          setTranslationData({});
        }
      } else if (router.locale !== translationData.locale) {
        downloadTranslations(router.locale as string);
      }
      // If the session data shows a different locale then the one set then the locale is changed in the session
      if (session && session.user.locale !== router.locale) {
        await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locale: router.locale,
          }),
        });
      }
    };
    findLocale();
  }, [router, translationData, session]);
  const t = (
    text: string,
    replacers?: Record<string, string | Date | number>,
  ): string => {
    let data = text;
    if (translationData[text]) {
      data = translationData[text];
    }
    if (replacers) {
      replacers.locale = translationData.locale ? translationData.locale : "en";
      Object.keys(replacers).forEach((e) => {
        if (typeof replacers[e] === "object") {
          data = data.replaceAll(
            `{${e}}`,
            (replacers[e] as Date).toLocaleDateString(router.locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          );
        } else if (typeof replacers[e] === "number") {
          data = data.replaceAll(
            `{${e}}`,
            replacers[e].toLocaleString(router.locale),
          );
        } else {
          data = data.replaceAll(`{${e}}`, replacers[e] as string);
        }
      });
    }
    return data;
  };
  const [loading, setLoading] = useState(false);
  // Checks if the page is loading
  useEffect(() => {
    const handleStart = (url: string, other: { shallow: boolean }) =>
      url !== router.asPath && !other.shallow && setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
    setInterval(() => handleComplete, 1000);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  });
  // Clears the notification on close
  function handleClose() {
    setNotifications({});
  }
  // Used to create the theme for the website and starts of in dark to not blind dark theme users
  const [colorMode, setColorMode] = useState<"light" | "dark">("dark");
  function updateColorMode(theme: "light" | "dark", force = false) {
    if (force || (session && session?.user.theme !== theme)) {
      fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme }),
      });
    }
    if (colorMode !== theme) {
      setColorMode(theme);
    }
  }
  // Defaults to dark if this is not supported by the browser
  const prefersDark = !useMediaQuery("(prefers-color-scheme: light)");
  // Sets the color scheme based on preferences)
  useEffect(() => {
    // Grabs the online preferences if they exist
    if (
      session &&
      (session.user.theme === "dark" || session.user.theme === "light")
    ) {
      updateColorMode(session.user.theme);
    } else if (
      localStorage.theme === "dark" ||
      localStorage.theme === "light"
    ) {
      // Uses localstorage if available
      updateColorMode(localStorage.theme);
    } else {
      // Uses the browser preferences
      const theme = prefersDark ? "dark" : "light";
      updateColorMode(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersDark, session]);
  const theme = createTheme({
    palette: {
      mode: colorMode,
    },
  });
  // Used to get the host
  const host =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXTAUTH_URL;
  return (
    <>
      <Head>
        {/* Adds the hreflang to the head for SEO purposes */
        router.locales?.map((e) => {
          return e == "en" ? (
            <link
              key={e}
              rel="alternate"
              hrefLang={e}
              href={`${host}${router.asPath}`}
            />
          ) : (
            <link
              key={e}
              rel="alternate"
              hrefLang={e}
              href={`${host}/${e}${router.asPath}`}
            />
          );
        })}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${host}${router.asPath}`}
        />
      </Head>
      <TranslateContext.Provider value={t}>
        <UserContext.Provider value={getUser}>
          <NotifyContext.Provider value={notify}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <GlobalStyles styles={{ Button: { m: "5px" } }} />
              {notifications.message && (
                <Snackbar open={true} onClose={handleClose}>
                  <Alert
                    onClose={handleClose}
                    severity={notifications.severity}
                    sx={{ width: "100%" }}
                  >
                    {notifications.message}
                  </Alert>
                </Snackbar>
              )}
              {/* Adds loading screen whenever a new page is being opened */}
              <Backdrop open={loading}>
                <CircularProgress />
              </Backdrop>
              <Component {...pageProps} setColorMode={updateColorMode} />
            </ThemeProvider>
          </NotifyContext.Provider>
        </UserContext.Provider>
      </TranslateContext.Provider>
    </>
  );
}

function App(Data: AppProps) {
  return (
    <SessionProvider>
      <MyApp {...Data} />
    </SessionProvider>
  );
}

export default App;
