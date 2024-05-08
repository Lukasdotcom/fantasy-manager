import connect from "../Modules/database";
import { pictures } from "#types/database";
import { existsSync, mkdirSync, rmSync, createWriteStream } from "fs";
import { rename } from "fs/promises";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { ReadableStream } from "stream/web";
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
    if (
      (
        await connection.query(
          "SELECT * FROM data WHERE value1='configDownloadPicture' AND value2='no'",
        )
      ).length === 0
    ) {
      await downloadPictureURL(picture[0].url, id);
    }
  }
  connection.end();
}
// Actually sends the request to download a picture
async function downloadPictureURL(url: string, id: number) {
  console.log("Downloading picture with id: " + id);
  const fileName = Math.random().toString(36).substring(2, 15) + ".jpg";
  await new Promise<void>(async (res, rej) => {
    if (!existsSync("./players/")) {
      mkdirSync("./players");
    }
    if (!existsSync("./players/download")) {
      mkdirSync("./players/download");
    }
    const stream = createWriteStream("./players/download/" + fileName);
    const { body, status } = await fetch(url).catch((e) => {
      return { body: undefined, status: e };
    });
    if (!body || status !== 200) {
      rej("Status code was not 200, but: " + status);
      return;
    }
    await finished(
      Readable.fromWeb(body as ReadableStream<Uint8Array>).pipe(stream),
    );
    res();
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
/**
 * Checks the pictures in the downloaded folder, deletes all invalid files in the folder, and updates the database accordingly.
 */
export async function checkPictures() {
  // Deletes all files in the downloaded folder
  if (existsSync("./players/download/")) {
    rmSync("./players/download/", { recursive: true });
  }
  const connection = await connect();
  await connection.query("UPDATE pictures SET downloading=downloaded");
  if (
    (
      await connection.query(
        "SELECT * FROM data WHERE value1='configDownloadPicture' AND value2='no'",
      )
    ).length > 0
  ) {
    console.log("Picture downloading is disabled");
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
  if (
    (
      await connection.query(
        "SELECT * FROM data WHERE value1='configDownloadPicture' AND value2='yes'",
      )
    ).length > 0
  ) {
    downloadAllPictures();
  }
  connection.end();
}
