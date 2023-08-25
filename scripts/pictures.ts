import connect, { pictures } from "../Modules/database";
import { existsSync, mkdirSync, rmSync } from "fs";
import { rename } from "fs/promises";
import { DownloaderHelper } from "node-downloader-helper";
// Used to get the correct path for a picture and will also make the folder if needed
export function picturePath(id: number, makeFolder = false) {
  if (makeFolder && !existsSync("./players/" + (id % 100))) {
    mkdirSync("./players/" + (id % 100));
  }
  return "./players/" + (id % 100) + "/" + id + ".jpg";
}
// Used to download a specific picture
export async function downloadPicture(id: number) {
  const connection = await connect();
  const picture: pictures[] = await connection.query(
    "SELECT * FROM pictures WHERE id=?",
    [id],
  );
  await connection.query("UPDATE pictures SET downloading=1 WHERE id=?", [id]);
  if (picture.length == 0) {
    return;
  }
  if (!picture[0].downloading) {
    if (process.env.DOWNLOAD_PICTURE !== "no") {
      await downloadPictureURL(picture[0].url, id);
    }
  }
  connection.end();
}
// Actually sends the request to download a picture
async function downloadPictureURL(url: string, id: number) {
  console.log("Downloading picture with id: " + id);
  const fileName = Math.random().toString(36).substring(2, 15) + ".jpg";
  await new Promise<void>((res, rej) => {
    if (!existsSync("./players/")) {
      mkdirSync("./players");
    }
    if (!existsSync("./players/download")) {
      mkdirSync("./players/download");
    }
    const dl = new DownloaderHelper(url, "./players/download", {
      fileName,
    });
    dl.on("end", () => res());
    dl.on("error", (e) => rej(e));
    dl.start().catch((e) => rej(e));
  })
    .then(async () => {
      const connection = await connect();
      await connection.query("UPDATE pictures SET downloaded=1 WHERE id=?", [
        id,
      ]);
      await rename("./players/download/" + fileName, picturePath(id, true));
      console.log("Finished downloading picture with id: " + id);
    })
    .catch((e) =>
      console.error(
        "Failed to download picture with error: " + e + " and id: " + id,
      ),
    );
}

// Used to download every single picture needed
export async function downloadAllPictures() {
  console.log("All pictures are being downloaded");
  const connection = await connect();
  const result = await connection.query(
    "SELECT * FROM pictures WHERE downloaded=0",
  );
  connection.query("UPDATE pictures SET downloading=1");
  result.forEach((e) => {
    downloadPictureURL(e.url, e.id);
  });
  connection.end();
}
// Checks every picture to make sure that it actually was downloaded
export async function checkPictures() {
  // Deletes all files in the downloaded folder
  if (existsSync("./players/download/")) {
    rmSync("./players/download/", { recursive: true });
  }
  const connection = await connect();
  await connection.query("UPDATE pictures SET downloading=downloaded");
  if (process.env.DOWNLOAD_PICTURE === "no") {
    console.log(
      "Picture downloading is disabled due to DOWNLOAD_PICTURE being no",
    );
    return;
  }
  const result = await connection.query(
    "SELECT * FROM pictures WHERE downloaded=1",
  );
  await Promise.all(
    result.map(
      (e) =>
        new Promise<void>(async (res) => {
          if (!existsSync(picturePath(e.id))) {
            await connection.query(
              "UPDATE pictures SET downloaded=0, downloading=0 WHERE id=?",
              [e.id],
            );
          }
          res();
        }),
    ),
  );
  connection.end();
  if (process.env.DOWNLOAD_PICTURE === "yes") {
    downloadAllPictures();
  }
}
