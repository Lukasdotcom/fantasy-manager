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
// Used to create a menu
const Layout = ({ session, league }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const pages = [
    { name: "Home", link: "/" },
    { name: "Rules", link: "/rules" },
    { name: "Leagues", link: "/leagues" },
  ];
  if (league) {
    pages.push({ name: "Standings", link: `/${league}` });
    pages.push({ name: "Squad", link: `/${league}/squad` });
    pages.push({ name: "Transfers", link: `/${league}/transfer` });
  }
  pages.push({ name: "Download", link: `/download` });
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
              {pages.map((page) => (
                <Link href={page.link} key={page.name}>
                  <MenuItem onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">{page.name}</Typography>
                  </MenuItem>
                </Link>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}>
            {pages.map((page) => (
              <Link href={page.link} key={page.name}>
                <Button
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  {page.name}
                </Button>
              </Link>
            ))}
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
