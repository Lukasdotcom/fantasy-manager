import { SessionProvider } from "next-auth/react";
import Login from "./Login";
import {
  Icon,
  MenuItem,
  Button,
  Container,
  Menu,
  Typography,
  IconButton,
  Toolbar,
  Box,
  AppBar,
} from "@mui/material";
import { useState } from "react";
import Link from "./Link";
import { useSession } from "next-auth/react";
// Returns all the menu items
function MenuItems({ league, handleCloseNavMenu }) {
  const { data: session } = useSession();
  const pages = [
    { name: "Home", link: "/" },
    { name: "Rules", link: "/rules" },
  ];
  pages.push({ name: "Download", link: `/download` });
  // Checks if the player is logged in
  if (session || league) {
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
        <Link href={page.link} key={page.name}>
          <MenuItem onClick={handleCloseNavMenu}>
            <Typography textAlign="center">{page.name}</Typography>
          </MenuItem>
        </Link>
      ))}
    </>
  );
}
// Used to create a menu
const Layout = ({ session, league }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const handleOpenNavMenu = (event) => {
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

          <Box sx={{ flexGrow: 1, display: { xs: "flex", sm: "none" } }}>
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
                display: { xs: "block", sm: "none" },
              }}
            >
              <SessionProvider session={session}>
                <MenuItems
                  league={league}
                  handleCloseNavMenu={handleCloseNavMenu}
                />
              </SessionProvider>
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}>
            <SessionProvider session={session}>
              <MenuItems
                league={league}
                handleCloseNavMenu={handleCloseNavMenu}
              />
            </SessionProvider>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <SessionProvider session={session}>
              <Login />
            </SessionProvider>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Layout;
