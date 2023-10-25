import { validLocales } from "#/locales/getLocales";
import { NextApiRequest, NextApiResponse } from "next";
// List of all static pages
const pages = [
  "/",
  "/error/locked",
  "/error/no-league",
  "/error/no-update",
  "/error/update",
  "/404",
  "/download",
  "/privacy",
  "/signin",
  "/signup",
];
// Used to revalidate any page using the NEXTAUTH_SECRET like at https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }
  if (req.body.secret !== process.env.NEXTAUTH_SECRET) {
    res.status(401).end("Invalid secret");
    return;
  }
  if (pages.includes(req.body.path) === false && req.body.path !== "*") {
    res.status(404).end("Page does not exist");
    return;
  }
  // Used to revalidate all pages
  if (req.body.path === "*") {
    console.log("Revalidating all pages");
    try {
      await Promise.all(
        pages.map(
          (page) =>
            new Promise<void>(async (finish) => {
              await revalidate(page, res);
              finish();
            }),
        ),
      );
      console.log("Revalidated all pages");
      res.status(200).end("success");
    } catch (err) {
      console.error("Failed to revalidate all pages");
      res.status(500).end("Failed to revalidate all pages");
    }
    return;
  }
  try {
    await revalidate(req.body.path, res);
    res.status(200).end("success");
  } catch (err) {
    console.error("Failed to revalidate page " + req.body.path);
    res.status(500).end("Failed to revalidate");
  }
}
/**
 * Revalidates the specified page for all valid locales and the default locale.
 *
 * @param {string} page - The page to revalidate.
 * @param {NextApiResponse} res - The response object used to revalidate the page.
 * @return {Promise<void>} A Promise that resolves when all revalidations are complete.
 */
async function revalidate(page: string, res: NextApiResponse): Promise<void> {
  await Promise.all([
    ...validLocales.map(async (locale) => {
      console.log("Revalidating the page " + "/" + locale + page);
      await res.revalidate("/" + locale + page);
      console.log("Revalidated the page " + "/" + locale + page);
    }),
    new Promise<void>(async (resolve) => {
      console.log("Revalidating the page " + page);
      await res.revalidate(page);
      console.log("Revalidated the page " + page);
      resolve();
    }),
  ]);
}
