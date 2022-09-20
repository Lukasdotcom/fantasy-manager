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
} from "@mui/material";
import { useRouter } from "next/router";
import { AppProps } from "next/app";
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
// Used to create the theme for the website
export const theme = createTheme({
  palette: {
    mode: "dark",
  },
});
interface Notification {
  message?: string;
  severity?: Severity;
}
type Severity = "error" | "info" | "warning";
function MyApp({ Component, pageProps }: AppProps) {
  // Used to start up matomo analytics
  useEffect(() => {
    init({ url: String(MATOMO_URL), siteId: String(MATOMO_SITE_ID) });
  }, []);
  const [notifications, setNotifications] = useState<Notification>({});
  // Used to send notification
  function notify(message: string, severity: Severity = "info") {
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
  return (
    <>
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

        <Component {...pageProps} notify={notify} />
      </ThemeProvider>
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
