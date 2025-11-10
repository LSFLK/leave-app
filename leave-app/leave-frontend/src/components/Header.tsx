
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
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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
  onMenuClick?: () => void;
};

const pathNames: Record<string, string> = {
  '': 'Dashboard',
  'my-leaves': 'My Leaves',
  'pending': 'Pending Approval',
  'reports': 'Reports',
};

const Header: React.FC<HeaderProps> = ({ currentView = 'my-leaves', isAdmin = false, onMenuClick }) => {
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [email, setEmail] = useState<string>('user@example.com');
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await getToken(); // may return string or undefined
        if (t) {
          const em = getEmailFromJWT(t) || 'user@example.com';
          if (mounted) setEmail(em);
        } else {
          if (mounted) setEmail('user@example.com');
        }
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
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
          {isSmall && (
            <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }} aria-label="menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              fontSize: { xs: 16, sm: 18, md: 20 },
              maxWidth: { xs: '40vw', sm: 'unset' },
            }}
          >
            Leave Management
          </Typography>

          <NavigateNextIcon sx={{ color: 'text.disabled', fontSize: 20, display: { xs: 'none', sm: 'inline-flex' } }} />
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              maxWidth: { sm: '45vw', md: '50vw' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {crumbs.map((segment, index) => {
              const isLast = index === crumbs.length - 1;
              const name = pathNames[segment] || segment;
              return isLast ? (
                <Typography key={`${segment}-${index}`} color="text.primary" fontWeight={500} noWrap>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.primary' }} aria-label="toggle theme" data-testid="theme-toggle">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              border: 1,
              borderColor: 'divider',
              borderRadius: 3,
              padding: { xs: '0 4px', sm: '1px 6px' },
              minWidth: 0,
            }}
          >
            <Tooltip title={email} disableInteractive placement="bottom-end">
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ ml: 1, maxWidth: { xs: 0, sm: 140 }, display: { xs: 'none', sm: 'block' } }}
              >
                {displayName}
              </Typography>
            </Tooltip>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
              aria-label={isXs ? 'account menu' : 'open account menu'}
              sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}
            >
              <Avatar sx={{ width: { xs: 28, sm: 32, md: 36 }, height: { xs: 28, sm: 32, md: 36 }, bgcolor: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                {initials}
              </Avatar>
              <Box
                component="span"
                sx={{
                  ml: 0.5,
                  fontSize: 16,
                  lineHeight: 1,
                  transition: 'transform .18s ease',
                  transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'inline' },
                }}
                aria-hidden
              >
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
