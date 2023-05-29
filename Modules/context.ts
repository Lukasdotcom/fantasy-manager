import { AlertColor } from "@mui/material";
import { Context, createContext } from "react";

export type NotifyType = (message: string, severity?: AlertColor) => void;
export const NotifyContext: Context<NotifyType> = createContext(
  (message: string, severity: AlertColor = "info") => {
    console.log(message, severity);
  }
);
export type UserType = (id: number, reset?: boolean) => Promise<string>;
export const UserContext: Context<UserType> = createContext(
  async (id: number, reset = false) => `${reset}`
);

export type TranslateType = (
  text: string,
  replacers?: Record<string, string | Date | number>
) => string;
/**
 * Used to translate text automatically. All the {variableName} are replace with what is given in the dictionary. These variables will be autoformatted if they are dates. And {locale} is automatically replaced with the current locale.
 * @param {string} text - The english text.
 * @param {Record<string, string | Date | number>} replacers - A dictionary of strings that should be replaced into the original.
 * @return {string} The translated text
 */
export const TranslateContext: Context<TranslateType> = createContext(
  (text: string, replacers?: Record<string, string | Date | number>) =>
    `${text}${Object.values(replacers || {}).join("")}`
);
