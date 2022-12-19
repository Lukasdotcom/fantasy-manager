import { signOut, useSession } from "next-auth/react";
import Link from "./Link";
import { Icon, IconButton, Tooltip } from "@mui/material";
import { UserAvatar } from "./Username";
import { useRouter } from "next/router";
import { useContext } from "react";
import { TranslateContext } from "../Modules/context";
// A simple sign in and sign out button that also allows you to open preferences
export default function Layout() {
  const handleClickIn = () => {
    router.push(`/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
  };
  const handleClickOut = () => {
    signOut();
  };
  const router = useRouter();
  const t = useContext(TranslateContext);
  const { data: session } = useSession();
  if (session == undefined || session.user == undefined) {
    return (
      <Tooltip title={t("Login")}>
        <IconButton id="login" onClick={handleClickIn} sx={{ p: 0 }}>
          <Icon>login</Icon>
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <>
      <Link id="usermenu" href="/usermenu" styled={false}>
        <Tooltip title={t("Open Usermenu")}>
          <IconButton onClick={() => {}}>
            <UserAvatar userid={session.user.id} />
          </IconButton>
        </Tooltip>
      </Link>
      <Tooltip title={t("Logout")}>
        <IconButton id="logout" onClick={handleClickOut} sx={{ p: 0 }}>
          <Icon>logout</Icon>
        </IconButton>
      </Tooltip>
    </>
  );
}
