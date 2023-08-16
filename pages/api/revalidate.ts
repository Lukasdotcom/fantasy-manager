import { NextApiRequest, NextApiResponse } from "next";
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
  try {
    console.log("Revalidating the page " + req.body.path);
    await res.revalidate(req.body.path);
    res.status(200).end("OK");
  } catch (err) {
    console.error("Failed to revalidate page " + req.body.path);
    res.status(500).end("Failed to revalidate");
  }
}
