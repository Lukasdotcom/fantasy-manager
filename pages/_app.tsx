import "../styles/globals.css";
import { init, push } from "@socialgouv/matomo-next";
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
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
interface Notification {
  message?: string;
  severity?: AlertColor;
}
const userData: { [key: number]: string } = {};
function MyApp({ Component, pageProps }: AppProps) {
  const [translationData, setTranslationData] = useState<
    Record<string, string>
  >(pageProps.t ? pageProps.t : {});
  // Used to start up matomo analytics
  useEffect(() => {
    init({ url: String(MATOMO_URL), siteId: String(MATOMO_SITE_ID) });
  }, []);
  const [notifications, setNotifications] = useState<Notification>({});
  // Used to send notification
  function notify(message: string, severity: AlertColor = "info") {
    setNotifications({
      message: message,
      severity: severity,
    });
  }
  // Gets the username asyncronously
  async function getUser(id: number, reset: boolean = false): Promise<string> {
    if (!userData[id] || reset) {
      const data = await fetch(`/api/user/${id}`).then((e) => e.json());
      userData[id] = data;
    }
    return userData[id];
  }
  const router = useRouter();
  // Grabs the translations if required
  useEffect(() => {
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
        }
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
  }, [router, translationData]);
  const t = (
    text: string,
    replacers?: Record<string, string | Date | number>
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
            })
          );
        } else if (typeof replacers[e] === "number") {
          data = data.replaceAll(
            `{${e}}`,
            replacers[e].toLocaleString(router.locale)
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
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  // Sets the color scheme based on preferences)
  useEffect(() => {
    // Uses lo
    if (localStorage.theme === "dark" || localStorage.theme === "light") {
      setColorMode(localStorage.theme);
    } else {
      setColorMode(prefersDark ? "dark" : "light");
    }
  }, [prefersDark]);
  const theme = createTheme({
    palette: {
      mode: colorMode,
    },
  });
  return (
    <>
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
              <Component {...pageProps} setColorMode={setColorMode} />
            </ThemeProvider>
          </NotifyContext.Provider>
        </UserContext.Provider>
      </TranslateContext.Provider>
      <SessionProvider>
        <UserMatomo />
      </SessionProvider>
    </>
  );
}

export default MyApp;

// Gives the user id when logged in
function UserMatomo() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session) push(["setUserId", String(session.user.id)]);
  });
  return <></>;
}
