import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, Divider } from '@mui/material';
import logo from '../assets/leave-logo.svg';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface SidebarProps {
  open: boolean;
  width?: number;
  isAdmin?: boolean;
  currentView: string;
  onSelect: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, width = 240, isAdmin, currentView, onSelect }) => {
  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          color: 'text.primary',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src={logo} width={28} height={28} alt="Leave App" />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Leave App
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton selected={currentView === 'my-leaves'} onClick={() => onSelect('my-leaves')}>
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="My Leaves" />
        </ListItemButton>
        {isAdmin && (
          <ListItemButton selected={currentView === 'pending'} onClick={() => onSelect('pending')}>
            <ListItemIcon><PendingActionsIcon /></ListItemIcon>
            <ListItemText primary="Pending Approvals" />
          </ListItemButton>
        )}
        <ListItemButton selected={currentView === 'reports'} onClick={() => onSelect('reports')}>
          <ListItemIcon><AssessmentIcon /></ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default Sidebar;
