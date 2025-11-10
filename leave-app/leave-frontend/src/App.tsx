import { useEffect, useState } from 'react';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveList from './LeaveList';
import Header from './components/Header';
import Footer from './components/Footer';
import Snackbar from './components/Snackbar';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Container from '@mui/material/Container';
// Removed local hamburger icon; Header provides the menu trigger.
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import './App.css';
import Sidebar from './components/Sidebar';
import PendingLeaves from './components/PendingLeaves';
import Reports from './components/Reports';
import { getToken, getEmailFromJWT } from './token';
import { apiFetch } from './api';


function App() {
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [view, setView] = useState<'my-leaves'|'pending'|'reports'>('my-leaves');
  const [snackbar, setSnackbar] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // set token 
  const [token, setToken] = useState<string >("No token");
  const [ bridgeisthere , setbridgeisthere ] = useState<boolean>(false);
  // Pass snackbar setter to children for feedback
  const handleShowSnackbar = (message: string, type?: 'success' | 'error') => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
  // Prefer nativebridge token if available
  let effectiveToken: string | undefined = undefined;
  try { effectiveToken = await getToken(); } catch {}
        if (!effectiveToken) {
          return; // cannot auth; skip
        }
        setToken(effectiveToken);
  setbridgeisthere(typeof window.nativebridge?.requestToken === 'function');

        // NOTE: Using standard Authorization header instead of custom x-jwt-assertion
        // to avoid CORS rejection when that custom header is not in Access-Control-Allow-Headers.
        // Backend interceptor currently reads x-jwt-assertion; if not updated, you must revert.
  const res = await apiFetch('/api/users/me', { headers: { 'Authorization': `Bearer ${effectiveToken}` } });
        const data = await res.json();
        if (data.status === 'success') setIsAdmin(Boolean(data.data?.isAdmin));
      } catch (e) {
        // swallow errors for initial load
      }
    };
    fetchMe();
  }, []);

  const drawerWidth = 240;
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(v => !v);
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', flexDirection: 'column' }}>
  <Header currentView={view} isAdmin={isAdmin} onMenuClick={isSmall ? handleDrawerToggle : undefined} />

      <Box display="flex" flex={1} position="relative">
        {/* Side navigation: permanent on desktop, temporary on mobile */}
        {isSmall ? (
          <Sidebar
            open={mobileOpen}
            width={drawerWidth}
            isAdmin={isAdmin}
            currentView={view}
            mobile
            onClose={handleDrawerToggle}
            onSelect={(v) => {
              setView(v as any);
              setShowForm(false);
              setMobileOpen(false);
            }}
          />
        ) : (
          <Sidebar
            open
            width={drawerWidth}
            isAdmin={isAdmin}
            currentView={view}
            onSelect={(v) => {
              setView(v as any);
              setShowForm(false);
            }}
          />
        )}
        <Box component="main" flex={1} display="flex" flexDirection="column" alignItems="stretch" justifyContent="flex-start" py={{ xs: 2, md: 4 }} px={{ xs: 1.5, sm: 2 }} width={isSmall ? '100%' : `calc(100% - ${drawerWidth}px)`} bgcolor="none">
          <Container maxWidth="lg" disableGutters sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Box sx={{ minHeight: 40 }} />
            {/* Request Leave text button removed per request; FAB remains on mobile */}
          </Container>
          {!isSmall && (
            <>
              <p>Token : {token}</p>
              <p>Email : {getEmailFromJWT(token)}</p>
              <p>Bridge is there : {bridgeisthere ? "Yes" : "No"} </p>
            </>
          )}
          {showForm && <LeaveRequestForm showSnackbar={handleShowSnackbar} />}
          {!showForm && (
            <Box width="100%">
              {view === 'my-leaves' && <LeaveList isAdmin={isAdmin} showSnackbar={handleShowSnackbar} />}
              {view === 'pending' && isAdmin && <PendingLeaves showSnackbar={handleShowSnackbar} />}
              {view === 'reports' && <Reports isAdmin={isAdmin} />}
            </Box>
          )}
          {/* Floating Action Button for quick access on mobile when form hidden */}
          {view === 'my-leaves' && !showForm && isSmall && (
            <Fab color="primary" aria-label="request leave" onClick={() => setShowForm(true)} sx={{ position: 'fixed', bottom: 72, right: 20, boxShadow: 6 }}>
              <AddIcon />
            </Fab>
          )}
          {view === 'my-leaves' && showForm && isSmall && (
            <Fab color="secondary" aria-label="close form" onClick={() => setShowForm(false)} sx={{ position: 'fixed', bottom: 72, right: 20, boxShadow: 6 }}>
              <AddIcon sx={{ transform: 'rotate(45deg)' }} />
            </Fab>
          )}
        </Box>
      </Box>

      <Footer />
  {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar(null)} />}
    </Box>
  );
}

export default App;
