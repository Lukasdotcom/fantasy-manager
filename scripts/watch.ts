/**
 * Starts the watcher by calling the 'watcher' function at regular intervals.
 */
export function startWatcher() {
  setInterval(watcher, 10000);
}
const startup = Date.now();
let server_booted = false;
/**
 * Watches for server crashes and exits the process when the server is down
 */
async function watcher() {
  if (server_booted) {
    fetch(String(process.env.NEXTAUTH_URL_INTERNAL)).catch(() => {
      console.log("Server crash detected exiting");
      process.exit();
    });
  } else {
    try {
      fetch(String(process.env.NEXTAUTH_URL_INTERNAL));
      server_booted = true;
      // Revalidates all pages when the server boots
      fetch(process.env.NEXTAUTH_URL_INTERNAL + "/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "*",
          secret: process.env.NEXTAUTH_SECRET,
        }),
      });
    } catch (_) {
      // If the server takes more than 10 minutes to boot then exit
      if (Date.now() - startup > 600000) {
        console.log("Server never booted in 10 minutes exiting");
        process.exit();
      }
    }
  }
}
