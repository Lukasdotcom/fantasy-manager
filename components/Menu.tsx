import { SessionProvider } from "next-auth/react";
import Login from "./Login";
import {
  Icon,
  MenuItem,
  Container,
  Menu,
  Typography,
  IconButton,
  Toolbar,
  Box,
  AppBar,
} from "@mui/material";
import { MouseEvent, MouseEventHandler, useState } from "react";
import Link from "./Link";
import { useSession } from "next-auth/react";
interface MenuItemsInterface {
  league: undefined | Number;
  handleCloseNavMenu: MouseEventHandler;
}
// Returns all the menu items
function MenuItems({ league, handleCloseNavMenu }: MenuItemsInterface) {
  const { data: session } = useSession();
  if (!league && session) {
    league = session.user.favoriteLeague
      ? session.user.favoriteLeague
      : undefined;
  }
  const pages = [
    { name: "Home", link: "/" },
    { name: "Rules", link: "/rules" },
  ];
  pages.push({ name: "Download", link: `/download` });
  // Checks if the player is logged in
  if (session || league) {
    if (session?.user.admin) {
      pages.push({ name: "Admin", link: "/admin" });
    }
    pages.push({ name: "Leagues", link: "/leagues" });
  }
  // Checks if the player should see the league links
  if (league) {
    pages.push({ name: "Standings", link: `/${league}` });
    pages.push({ name: "Squad", link: `/${league}/squad` });
    pages.push({ name: "Transfers", link: `/${league}/transfer` });
  }
  return (
    <>
      {pages.map((page) => (
        <Link styled={false} href={page.link} key={page.name}>
          <MenuItem onClick={handleCloseNavMenu}>
            <Typography textAlign="center">{page.name}</Typography>
          </MenuItem>
        </Link>
      ))}
    </>
  );
}
interface MainInterface {
  league?: number;
}
// Used to create a menu
const Layout = ({ league }: MainInterface) => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Icon>sports_soccer</Icon>

          <Box sx={{ flexGrow: 1, display: { sm: "flex", md: "none" } }}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <Icon>menu</Icon>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { sm: "block", md: "none" },
              }}
            >
              <SessionProvider>
                <MenuItems
                  league={league}
                  handleCloseNavMenu={handleCloseNavMenu}
                />
              </SessionProvider>
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <SessionProvider>
              <MenuItems
                league={league}
                handleCloseNavMenu={handleCloseNavMenu}
              />
            </SessionProvider>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <SessionProvider>
              <Login />
            </SessionProvider>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Layout;
