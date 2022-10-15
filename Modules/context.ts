import { AlertColor } from "@mui/material";
import { createContext } from "react";
export type NotifyType = (message: string, severity?: AlertColor) => void;
export const NotifyContext = createContext(
  (message: string, severity: AlertColor = "info") => {}
);
