import { useEffect, useState } from "react";
import { Avatar, Chip, useTheme } from "@mui/material";
// Simply just shows the name of the user given there userid
export default function Username({ userid }) {
  const [username, setUsername] = useState("");
  useEffect(() => {
    fetch(`/api/user/${userid}`).then(async (val) => {
      const newUsername = await val.json();
      setUsername(newUsername);
    });
  }, [userid]);
  return <>{username}</>;
}
// Creates a simple chip for the user
export function UserChip({ userid }) {
  const [username, setUsername] = useState("A");
  useEffect(() => {
    if (userid != 0) {
      fetch(`/api/user/${userid}`).then(async (val) => {
        const newUsername = await val.json();
        setUsername(newUsername);
      });
    }
  }, [userid]);
  const theme = useTheme();
  if (userid == 0) return <p>AI</p>;
  // Cenerates a color based on the name
  const background = stringToColor(userid);
  const text = theme.palette.getContrastText(background);
  return (
    <Chip
      avatar={
        <Avatar sx={{ bgcolor: background, color: text }}>
          {`${username.split(" ")[0][0]}${
            username.split(" ").length > 1 ? username.split(" ")[1][0] : ""
          }`}
        </Avatar>
      }
      label={username}
    />
  );
}
// Shows an avatar for the user with a color based on the name
export function UserAvatar({ userid }) {
  const [username, setUsername] = useState("A");
  useEffect(() => {
    fetch(`/api/user/${userid}`).then(async (val) => {
      const newUsername = await val.json();
      setUsername(newUsername);
    });
  }, [userid]);
  // Cenerates a color based on the name

  const background = stringToColor(userid);

  const theme = useTheme();
  const text = theme.palette.getContrastText(background);
  return (
    <Avatar sx={{ bgcolor: background, color: text }}>
      {`${username.split(" ")[0][0]}${
        username.split(" ").length > 1 ? username.split(" ")[1][0] : ""
      }`}
    </Avatar>
  );
}

function stringToColor(string) {
  let hash = string * 67280021310721;
  let i;
  let color = "#";
  for (i = 0; i < 3; i += 1) {
    const value = hash % 256;
    hash = parseInt(hash / 256);
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}
