import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import DrawerMui from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import { Outlet } from "react-router-dom";
import { drawerWidth } from "../../config";
import DrawerContent from "./Drawer/DrawerContent";
import { useState } from "react";
import { isMobile } from "react-device-detect";
import Footer from "./Footer";
import { Paper } from "@mui/material";

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function PersistentDrawerLeft() {
  return (
    <Box sx={{ display: "flex" }}>
      <DrawerMui
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
      >
        <DrawerContent />
      </DrawerMui>
      <Main open={false} sx={{ padding: "0px 12px 100px 12px !important" }}>
        <Box component="main" sx={{ pt: 5, padding: "0px !important" }}>
          <Outlet />
        </Box>
        {isMobile && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 2,
            }}
            elevation={3}
          >
            <Footer />
          </Paper>
        )}
      </Main>
    </Box>
  );
}
