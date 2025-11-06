

import { useEffect, useState } from 'react';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveList from './LeaveList';
import Header from './components/Header';
import Footer from './components/Footer';
import Snackbar from './components/Snackbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import './App.css';
import Sidebar from './components/Sidebar';
import PendingLeaves from './components/PendingLeaves';
import Reports from './components/Reports';
import { getToken } from './token';


function App() {
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [view, setView] = useState<'my-leaves'|'pending'|'reports'>('my-leaves');
  const [snackbar, setSnackbar] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Pass snackbar setter to children for feedback
  const handleShowSnackbar = (message: string, type?: 'success' | 'error') => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
  const token = await getToken();
  const res = await fetch('/api/users/me', { headers: { 'x-jwt-assertion': token } });
        const data = await res.json();
        if (data.status === 'success') setIsAdmin(Boolean(data.data?.isAdmin));
      } catch {}
    };
    fetchMe();
  }, []);

  const drawerWidth = 240;
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', flexDirection: 'column' }}>
  <Header currentView={view} isAdmin={isAdmin} />
      <Box display="flex" flex={1}>
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
        <Box component="main" flex={1} display="flex" flexDirection="column" alignItems="stretch" justifyContent="flex-start" py={4} width={`calc(100% - ${drawerWidth}px)`} bgcolor="none">
          <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box />
            {view === 'my-leaves' && (
              <Button
                variant="contained"
                sx={{
                  width: 160,
                  py: 1,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
                  textTransform: 'none',
                }}
                onClick={() => setShowForm(v => !v)}
              >
                {showForm ? 'Hide Form' : 'Request Leave'}
              </Button>
            )}
          </Container>
          {showForm && <LeaveRequestForm showSnackbar={handleShowSnackbar} />}
          {!showForm && (
            <Box width="100%">
              {view === 'my-leaves' && <LeaveList isAdmin={isAdmin} showSnackbar={handleShowSnackbar} />}
              {view === 'pending' && isAdmin && <PendingLeaves showSnackbar={handleShowSnackbar} />}
              {view === 'reports' && <Reports isAdmin={isAdmin} />}
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
      {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar(null)} />}
    </Box>
  );
}

export default App;
