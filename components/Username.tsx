import { useContext, useEffect, useState } from "react";
import { Avatar, Chip, SxProps, useTheme, Theme } from "@mui/material";
import { UserContext } from "../Modules/context";
interface Props {
  userid: number;
}
// Simply just shows the name of the user given there userid
export default function Username({ userid }: Props) {
  const [getUser, getUserNow] = useContext(UserContext);
  const [username, setUsername] = useState<string>(getUserNow(userid));
  useEffect(() => {
    getUser(userid).then((e) => setUsername(e));
  }, [userid, getUser]);
  return <>{username}</>;
}
interface UserChipProps extends Props {
  sx?: SxProps<Theme>;
}
// Creates a simple chip for the user
export function UserChip({ userid, sx }: UserChipProps) {
  const [getUser, getUserNow] = useContext(UserContext);
  const [username, setUsername] = useState(getUserNow(userid));
  useEffect(() => {
    if (userid > 0) {
      getUser(userid).then((e) => setUsername(e));
    }
  }, [userid, getUser]);
  const theme = useTheme();
  if (userid == 0) return <p>AI</p>;
  if (userid == -1) return <p>No one</p>;
  // Cenerates a color based on the name
  const background = stringToColor(userid);
  const text = theme.palette.getContrastText(background);
  return (
    <Chip
      sx={sx}
      avatar={
        <Avatar sx={{ bgcolor: background }}>
          <div style={{ color: text }}>{`${username.split(" ")[0][0]}${
            username.split(" ").length > 1 ? username.split(" ")[1][0] : ""
          }`}</div>
        </Avatar>
      }
      label={username}
    />
  );
}
// Shows an avatar for the user with a color based on the name
export function UserAvatar({ userid }: Props) {
  const [getUser, getUserNow] = useContext(UserContext);
  const [username, setUsername] = useState(getUserNow(userid));
  useEffect(() => {
    getUser(userid).then((e) => setUsername(e));
  }, [userid, getUser]);
  // Cenerates a color based on the name
  const background = stringToColor(userid);

  const theme = useTheme();
  const text = theme.palette.getContrastText(background);
  const split_username = username.split(" ");
  return (
    <Avatar sx={{ bgcolor: background }}>
      <div style={{ color: text }}>{`${
        split_username[0].length > 0 ? split_username[0][0] : ""
      }${split_username.length > 1 ? split_username[1][0] : ""}`}</div>
    </Avatar>
  );
}
// This turns a number into a random color.
export function stringToColor(string: number) {
  let hash =
    (string * (1 + Math.sqrt(5))) / 2 -
    Math.floor((string * (1 + Math.sqrt(5))) / 2);
  hash = Math.floor(hash * 256 * 256 * 256);
  let i;
  let color = "#";
  for (i = 0; i < 3; i += 1) {
    const value = hash % 256;
    hash = parseInt((hash / 256).toString());
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}
