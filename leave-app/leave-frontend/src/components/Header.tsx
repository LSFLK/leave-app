
import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
//import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useThemeMode } from '../theme';
import { getEmailFromJWT, getToken } from '../token';

type HeaderProps = {
  currentView?: 'my-leaves' | 'pending' | 'reports';
  isAdmin?: boolean;
};

const pathNames: Record<string, string> = {
  '': 'Dashboard',
  'my-leaves': 'My Leaves',
  'pending': 'Pending Approval',
  'reports': 'Reports',
};

const Header: React.FC<HeaderProps> = ({ currentView = 'my-leaves', isAdmin = false }) => {
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [email, setEmail] = useState<string>('user@example.com');
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await getToken(); // returns hardcoded token
        const em = getEmailFromJWT(t) || 'user@example.com';
        if (mounted) setEmail(em);
      } catch {
        if (mounted) setEmail('user@example.com');
      }
    })();
    return () => { mounted = false; };
  }, []);
  const displayName = useMemo(() => (email?.split('@')[0] ?? 'User'), [email]);
  const initials = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName]);

  const crumbs = useMemo(() => {
    const list = [''];
    if (currentView === 'pending' && isAdmin) list.push('pending');
    else if (currentView === 'reports') list.push('reports');
    else list.push('my-leaves');
    return list;
  }, [currentView, isAdmin]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  // const handleLogout = () => {
  //   handleMenuClose();
  //   // Clear a few common storages and reload
  //   try {
  //     window.localStorage.removeItem('jwt');
  //     window.sessionStorage.removeItem('jwt');
  //   } catch {}
  //   window.location.reload();
  // };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="h1" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Leave Management
          </Typography>

          <NavigateNextIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}>
            {crumbs.map((segment, index) => {
              const isLast = index === crumbs.length - 1;
              const name = pathNames[segment] || segment;
              return isLast ? (
                <Typography key={`${segment}-${index}`} color="text.primary" fontWeight={500}>
                  {name}
                </Typography>
              ) : (
                <Link key={`${segment}-${index}`} underline="hover" color="text.secondary" sx={{ cursor: 'default' }}>
                  {name}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.primary' }} data-testid="theme-toggle">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 1, borderColor: 'divider', borderRadius: 3, padding: '1px 6px' }}>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {displayName}
            </Typography>
            <IconButton onClick={handleMenuOpen} size="small" aria-haspopup="true" aria-expanded={Boolean(anchorEl)} sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>{initials}</Avatar>
              <Box component="span" sx={{ ml: 0.5, fontSize: 16, lineHeight: 1, transition: 'transform .18s ease', transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)', color: 'text.secondary' }} aria-hidden>
                ▾
              </Box>
            </IconButton>
          </Box>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <MenuItem disabled>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              {email}
            </MenuItem>
            {/* <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Sign Out
            </MenuItem> */}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
