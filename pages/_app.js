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
const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
// Used to create the theme for the website
export const theme = createTheme({
  palette: {
    mode: "dark",
  },
});
function MyApp({ Component, pageProps }) {
  // Used to start up matomo analytics
  useEffect(() => {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }, []);
  const [notifications, setNotifications] = useState([]);
  // Used to send notification
  function notify(message, severity = "info") {
    setNotifications([
      ...notifications,
      {
        id: parseInt(Math.random() * 100000),
        message: message,
        severity: severity,
        autoHideDuration: severity === "error" ? 10000 : 4000,
      },
    ]);
  }
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  // Checks if the page is loading
  useEffect(() => {
    const handleStart = (url) => url !== router.asPath && setLoading(true);
    const handleComplete = (url) => url === router.asPath && setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  });
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{ Button: { m: "5px" } }} />
        {notifications.map((notification) => {
          function handleClose(event, reason) {
            setNotifications(
              notifications.filter((e) => e.id !== notification.id)
            );
          }
          return (
            <Snackbar key={notification.id} open={true} onClose={handleClose}>
              <Alert
                onClose={handleClose}
                severity={notification.severity}
                sx={{ width: "100%" }}
              >
                {notification.message}
              </Alert>
            </Snackbar>
          );
        })}
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
