import { signIn, signOut, useSession } from "next-auth/react";
import Link from "./Link";
import { Icon, IconButton, Tooltip } from "@mui/material";
import { UserAvatar } from "./Username";
// A simple sign in and sign out button that also allows you to open preferences
export default function Layout() {
  const handleClickIn = () => {
    signIn();
  };
  const handleClickOut = () => {
    signOut();
  };
  const { data: session } = useSession();
  if (session == undefined || session.user == undefined) {
    return (
      <Tooltip title="Login">
        <IconButton id="login" onClick={handleClickIn} sx={{ p: 0 }}>
          <Icon>login</Icon>
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <>
      <Tooltip title="Open Usermenu">
        <Link id="usermenu" href="/usermenu">
          <IconButton onClick={() => {}}>
            <UserAvatar userid={session.user.id} />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip title="Logout">
        <IconButton id="logout" onClick={handleClickOut} sx={{ p: 0 }}>
          <Icon>logout</Icon>
        </IconButton>
      </Tooltip>
    </>
  );
}
