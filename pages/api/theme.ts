import connect from "#/Modules/database";
import getLocales from "#/locales/getLocales";
import { ThemeOptions } from "@mui/material";
import { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.status(200).json(await getTheme());
}

/**
+ * Retrieves the theme from the database.
+ *
+ * @return {Promise<{dark: ThemeOptions, light: ThemeOptions}>} The theme options.
+ */
export const getTheme = async (): Promise<{
  dark: ThemeOptions;
  light: ThemeOptions;
}> => {
  const connection = await connect();
  const theme: { dark: ThemeOptions; light: ThemeOptions } = {
    dark: {
      palette: {
        mode: "dark",
      },
    },
    light: {
      palette: {
        mode: "light",
      },
    },
  };
  try {
    theme.dark = await connection
      .query("SELECT * FROM data WHERE value1='configThemeDark'")
      .then((res) => (res.length > 0 ? JSON.parse(res[0].value2) : theme.dark));
  } catch (e) {
    console.error("Failed to parse dark theme");
  }
  try {
    theme.light = await connection
      .query("SELECT * FROM data WHERE value1='configThemeLight'")
      .then((res) =>
        res.length > 0 ? JSON.parse(res[0].value2) : theme.light,
      );
  } catch (e) {
    console.error("Failed to parse light theme");
  }
  connection.end();
  return theme;
};

/**
 * Retrieves all data that should be in pregenerated pages for _app.tsx.
 *
 * @param {string | undefined} locale - The locale to retrieve data for.
 * @return {Promise<{ theme: {dark: ThemeOptions, light: ThemeOptions}; t: Record<string, string> | null }>} - A promise that resolves to an object containing the theme and locales data.
 */
export const getData = async (
  locale: string | undefined,
): Promise<{
  theme: { dark: ThemeOptions; light: ThemeOptions };
  translate: Record<string, string> | null;
}> => {
  return {
    theme: await getTheme(),
    translate: await getLocales(locale),
  };
};
