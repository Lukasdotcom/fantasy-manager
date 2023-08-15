import connect, { pictures } from "../Modules/database";
import { existsSync, mkdirSync, rmSync } from "fs";
import { DownloaderHelper } from "node-downloader-helper";

// Used to download a specific picture
export async function downloadPicture(
  id: number,
): Promise<{ height: number; width: number } | void> {
  const connection = await connect();
  const picture: pictures[] = await connection.query(
    "SELECT * FROM pictures WHERE id=?",
    [id],
  );
  await connection.query("UPDATE pictures SET downloaded=1 WHERE id=?", [id]);
  if (picture.length == 0) {
    return;
  }
  if (!picture[0].downloaded) {
    if (process.env.DOWNLOAD_PICTURE !== "no") {
      await downloadPictureURL(picture[0].url, id);
    }
  }
  connection.end();
  return { height: picture[0].height, width: picture[0].width };
}
// Actually sends the request to download a picture
async function downloadPictureURL(url: string, id: number) {
  console.log("Downloading picture with id: " + id);
  await new Promise<void>((res, rej) => {
    if (!existsSync("./players/")) {
      mkdirSync("./players");
    }
    if (existsSync("./players/" + id + ".jpg")) {
      rmSync("./players/" + id + ".jpg");
    }
    const dl = new DownloaderHelper(url, "./players/", {
      fileName: id + ".jpg",
    });
    dl.on("end", () => res());
    dl.on("error", (e) => rej(e));
    dl.start().catch((e) => rej(e));
  })
    .then(async () => {
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
  connection.query("UPDATE pictures SET downloaded=1");
  result.forEach((e) => {
    downloadPictureURL(e.url, e.id);
  });
  connection.end();
}
// Checks every picture to make sure that it actually was downloaded
export async function checkPictures() {
  if (process.env.DOWNLOAD_PICTURE === "no") {
    console.log(
      "Picture downloading is disabled due to DOWNLOAD_PICTURE being no",
    );
    return;
  }
  const connection = await connect();
  const result = await connection.query(
    "SELECT * FROM pictures WHERE downloaded=1",
  );
  await Promise.all(
    result.map(
      (e) =>
        new Promise<void>(async (res) => {
          if (!existsSync("./players/" + e.id + ".jpg")) {
            await connection.query(
              "UPDATE pictures SET downloaded=0 WHERE id=?",
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
