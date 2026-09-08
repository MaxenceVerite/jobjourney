// src/components/Layout.tsx
import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  Button,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  AppBar,
  Toolbar,
  InputBase,
  IconButton,
  Badge,
  Container,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import WorkIcon from '@mui/icons-material/Work';
import StarIcon  from "@mui/icons-material/Star";
import PersonIcon from "@mui/icons-material/Person";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationCenter from "../../components/notifications/NotificationCenter";

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import LogoTwoLines from "../../components/common/LogoTwoLines";
import UserMenu from "../../components/common/menu/UserMenu";
import PageTransition from "../../components/common/PageTransition";

const drawerWidth = 280; // Changed to fixed pixel width for better predictability across screens
const navItems = [
  {
    label: "Mon Dashboard",
    route: "/dashboard",
    icon: <DashboardRoundedIcon />,
  },
  {
    label: "Mes opportunités",
    route: "/opportunities",
    icon: <StarIcon />,
  },
  {
    label: "Mes fiches",
    route: "/sheets",
    icon: <AssignmentIcon />,
  },
  {
    label: "Mes documents",
    route: "/documents",
    icon: <FolderCopyRoundedIcon />,
  },
  {
    label: "Offres d'emploi",
    route: "/jobboard",
    icon: <WorkIcon />,
  },
];

const Layout = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const location = useLocation();

  const isSelected = (item:any): boolean => {
    return location.pathname.includes(item.route);
  };

  const selected = (): any => {
    const [foundItem] = navItems.filter((c) =>
      location.pathname.includes(c.route)
    );
    return foundItem;
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const drawerContent = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100%"
      paddingTop="14%"
      sx={{ backgroundColor: "primary.main" }}
    >
      <LogoTwoLines />
      <Divider sx={{ height: "15%" }} />
      <List sx={{ width: "100%" }}>
        {navItems.map((item) => {
          return (
            <ListItemButton
              key={item.route}
              onClick={() => {
                navigate(item.route);
                if (isMobile) handleDrawerToggle();
              }}
              selected={isSelected(item)}
              sx={{
                color: "common.white",
                justifyContent: "end",
                marginRight: "10%",
                paddingLeft: isMobile ? 4 : 10,
                transition: "all 0.2s ease-in-out",
                "&:hover":{
                  backgroundColor: "success.main",
                  transform: "translateX(4px)",
                },
                "& .MuiListItemIcon-root": {
                  color: "common.white",
                  transition: "color 0.2s",
                },
                "&.Mui-selected": {
                  bgcolor: "common.white",
                  color: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                  "&:hover":{
                    backgroundColor: 'common.white'
                  }
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            backgroundColor: "primary.main",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          backgroundColor: "primary.main",
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 }, 
          minHeight: "100vh", 
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          overflowX: "hidden",
          boxSizing: "border-box"
        }}
      >
        <Container maxWidth="xl" sx={{ padding: { xs: 0, sm: 2 } }}>
          <Box marginBottom={{ xs: "5%", md: "3%" }} marginTop={{ xs: "2%", md: "2%" }}>
            <Toolbar disableGutters sx={{ paddingLeft: "0px", minHeight: {xs: "48px"} }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 0.5, color: 'primary.main' }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Typography
                fontWeight="600"
                color="primary.main"
                flexGrow="1"
                variant={isMobile ? "h6" : "h4"}
                sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' } }}
                noWrap
              >
                {selected()?.label}
              </Typography>

              <Box color='primary.main' sx={{ display: 'flex', alignItems: 'center' }}> 
                <TextField
                  name="globalSearch"
                  placeholder="Rechercher ..."
                  id="globalSearch"
                  variant="standard"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon  />
                      </InputAdornment>
                    ),
                  }}
                  sx = {{
                   marginRight: "5%",
                   display: { xs: 'none', sm: 'block' } // Hide search on very small screens for now, or adapt it
                  }}
                />
                <Box sx={{ display: 'flex', gap: {xs: 0, sm: 1} }}>
                  <IconButton
                    aria-label="compte utilisateur"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                    sx={{ p: {xs: 0.5, sm: 1} }}
                  >
                    <PersonIcon />
                  </IconButton>
                  <UserMenu anchorEl={anchorEl} handleClose={handleClose} />
                  <NotificationCenter />
                </Box>
              </Box>
            </Toolbar>
          </Box>
          <PageTransition locationKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
