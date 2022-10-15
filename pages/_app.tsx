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
import { NotifyContext } from "../Modules/context";
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
interface Notification {
  message?: string;
  severity?: AlertColor;
}
function MyApp({ Component, pageProps }: AppProps) {
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
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  // Checks if the page is loading
  useEffect(() => {
    const handleStart = (url: string) =>
      url !== router.asPath && setLoading(true);
    const handleComplete = (url: string) =>
      url === router.asPath && setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

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
