import { AlertColor } from "@mui/material";
import { Context, createContext } from "react";

export type NotifyType = (message: string, severity?: AlertColor) => void;
export const NotifyContext: Context<NotifyType> = createContext(
  (message: string, severity: AlertColor = "info") => {}
);
export type UserType = (id: number, reset?: boolean) => Promise<string>;
export const UserContext: Context<UserType> = createContext(
  async (id: number, reset: boolean = false) => ""
);
