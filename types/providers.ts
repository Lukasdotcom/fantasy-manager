// The oauth providers available
export type Providers = "github" | "google";

export const getProviders = () => {
  const list: Providers[] = [];
  if (
    !(process.env.GOOGLE_ID === undefined || process.env.GOOGLE_ID === "") &&
    !(
      process.env.GOOGLE_SECRET === undefined ||
      process.env.GOOGLE_SECRET === ""
    )
  ) {
    list.push("google");
  }
  if (
    !(process.env.GITHUB_ID === undefined || process.env.GITHUB_ID === "") &&
    !(
      process.env.GITHUB_SECRET === undefined ||
      process.env.GITHUB_SECRET === ""
    )
  ) {
    list.push("github");
  }
  return list;
};
