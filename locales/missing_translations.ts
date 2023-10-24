import { readFileSync, readdirSync, statSync } from "fs";
import { validLocales } from "./getLocales";
let translations: { locale: string; translations: Set<string> }[] = [];
let neededTranslations: { locale: string; translations: Set<string> }[] = [];
// Finds all files in pages directory
async function main() {
  translations = await Promise.all(
    validLocales.map((e) => {
      return {
        locale: e,
        translations: new Set(
          Object.keys(JSON.parse(String(readFileSync(`./locales/${e}.json`)))),
        ),
      };
    }),
  );
  neededTranslations = await Promise.all(
    translations.map((e) => {
      return {
        locale: e.locale,
        translations: new Set(e.translations),
      };
    }),
  );
  const shouldNotBeMissing = [
    "Playeruid", // First are the download translations
    "Name",
    "Ascii Name",
    "Club",
    "Picture Url",
    "Value",
    "Sale Price",
    "Position",
    "Forecast",
    "Total Points",
    "Average Points",
    "Last Match Points",
    "Exists",
    "League",
    "Failure", // Second are the translations for the notification on the index page.
    "Failing to check for updates.",
    "Out of date",
    "New update for more info Click Here",
    "Not for Production",
    "This is the development or testing version of this software. Do not use in production.",
    "Player is not your player", // Third are the translations for the squad api.
    "No more room in formation",
    "Player is locked",
    "Player is not in the field",
    "Player has already played",
    "att", // Fourth are the positions
    "mid",
    "def",
    "gk",
    "dark", // Fith are the themes
    "light",
    "locale", // Sixth is the key that shows the locale of that one.
  ]; // These are translations that aren't passed directly to t() or res.status().end() but are translated.
  // Removes all the translations that should not be missing
  neededTranslations.forEach((e) => {
    shouldNotBeMissing.forEach((f) => {
      e.translations.delete(f);
    });
  });
  console.log(
    "Note that this is meant to be used to check, there are a lot of false positives.",
  );
  console.log("Looking for missing translations...");
  let missing = false;
  // Fist of all checks the shouldNotBeMissing
  for (let i = 0; i < translations.length; i++) {
    for (const test of shouldNotBeMissing) {
      if (!translations[i].translations.has(test)) {
        console.log(
          "Missing translation: `" + test + "` in " + translations[i].locale,
        );
        missing = true;
      }
    }
  }
  // Finds all the t() calls in pages
  const a = locate("./pages", /\Wt\([\w|\s]*"([^"]*)"/gm, [1]);
  // Finds all the t() calls in components
  const b = locate("./components", /\Wt\([\w|\s]*"([^"]*)"/gm, [1]);
  // Finds all the res.status() calls
  const c = locate(
    "./pages/api",
    /res\s*.status\([0-9]*\)\s*.end\(\s*(("([^"]*)")|(`([^(`|$)]*)`))/gm,
    [3, 5],
  );
  missing = missing || a || b || c;
  if (!missing) {
    console.log("No missing translations found");
  }
  console.log("Looking for unecessary translations...");
  let unecessary = false;
  for (let i = 0; i < translations.length; i++) {
    unecessary = unecessary || translations[i].translations.size > 0;
    neededTranslations[i].translations.forEach((e) => {
      console.log("`" + e + "` is not needed in " + translations[i].locale);
    });
  }
  if (!unecessary) {
    console.log("No unecessary translations found");
  }
}
function locate(dir: string, regex: RegExp, groups: number[]): boolean {
  let missing = false;
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = dir + "/" + file;
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      const result = locate(filePath, regex, groups);
      missing = missing || result;
    } else {
      // Makes sure this is a js/ts file
      if (
        file.endsWith(".tsx") ||
        file.endsWith(".js") ||
        file.endsWith(".ts")
      ) {
        const data = readFileSync(filePath);
        const result = validate(String(data), regex, groups);
        missing = missing || result;
      }
    }
  }
  return missing;
}
function validate(data: string, regex: RegExp, groups: number[]): boolean {
  let match;
  let missing = false;
  while ((match = regex.exec(data)) !== null) {
    for (let i = 0; i < validLocales.length; i++) {
      for (const valid_match of groups) {
        if (match[valid_match] === undefined) {
          continue;
        }
        // Finds all the empty t() calls
        if (
          match[valid_match].replaceAll(/{[^{]*}/gm, "").replaceAll(" ", "") !==
          ""
        ) {
          if (!translations[i].translations.has(match[valid_match])) {
            console.log(
              "Missing translation: `" +
                match[valid_match] +
                "` in " +
                translations[i].locale,
            );
            missing = true;
          }
          if (neededTranslations[i].translations.has(match[valid_match])) {
            neededTranslations[i].translations.delete(match[valid_match]);
          }
        }
      }
    }
  }
  return missing;
}
main();
