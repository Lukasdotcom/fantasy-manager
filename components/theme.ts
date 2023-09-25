/**
 * Converts MUI Theme code to a JSON string.
 * For example would convert the following string:
 * ```js
 * import { ThemeOptions } from '@mui/material/styles';
 * export const themeOptions: ThemeOptions = {
 *  palette: {
 *    mode: 'dark',
 *    primary: {
 *      main: '#90caf9',
 *    },
 *    secondary: {
 *      main: '#ce93d8',
 *    },
 *    background: {
 *      default: '#121212',
 *      paper: '#121212',
 *    },
 *  },
 * };
 *```
 * To the following json:
 * ```json
 * {
 *  "palette": {
 *    "mode": "dark",
 *    "primary": {
 *      "main": "#90caf9"
 *    },
 *    "secondary": {
 *      "main": "#ce93d8"
 *    },
 *    "background": {
 *      "default": "#121212",
 *      "paper": "#121212"
 *    }
 *  }
 * }
 * ```
 *
 * @param {string} text - The MUI Theme code to be converted.
 * @return {string} The JSON string representing the converted code.
 */
export const MUIThemeCodetoJSONString = (text: string): string => {
  return text
    .replace(/import.*?;/g, "") // Remove import statements
    .replace(/export const.*? = /, "") // Remove export statement
    .replace(/;/g, "") // Remove semicolon
    .replace(/ThemeOptions/g, "") // Remove type annotation
    .replace(/(\w+)(:)/g, '"$1"$2') // Add quotation marks around keys
    .replaceAll("'", '"') // Remove single quotes
    .replace(/,\n(.*)\}/g, "\n$1}") // Remove trailing commas
    .replaceAll("import", "")
    .trim(); // Remove leading/trailing whitespace
};
