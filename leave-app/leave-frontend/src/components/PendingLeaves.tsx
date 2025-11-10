import React from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Card, CardContent, Stack, Divider } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { getToken } from '../token';
import { apiFetch, parseJsonSafe } from '../api';

interface Leave {
  leave_id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface PendingLeavesProps {
  showSnackbar?: (message: string, type?: 'success' | 'error') => void;
}

const PendingLeaves: React.FC<PendingLeavesProps> = ({ showSnackbar }) => {
  const [rows, setRows] = React.useState<Leave[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) { setError('Missing auth token'); setLoading(false); return; }
      const res = await apiFetch('/api/admin/leaves/pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonSafe<any>(res);
      if (data.status === 'success') {
        setRows(data.data || []);
      } else {
        setError(data.message || 'Failed to load pending leaves');
        showSnackbar?.(data.message || 'Failed to load pending leaves', 'error');
      }
    } catch (e) {
      setError('Network error');
      showSnackbar?.('Network error', 'error');
    }
    setLoading(false);
  };

  React.useEffect(() => { reload(); }, []);

  const act = async (leave_id: string, action: 'approve'|'reject') => {
    try {
      const token = await getToken();
      if (!token) { showSnackbar?.('Missing auth token', 'error'); return; }
      const res = await apiFetch(`/api/admin/leaves/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ leave_id }),
      });
      const data = await parseJsonSafe<any>(res);
      if (data.status === 'success') {
        showSnackbar?.(data.message, 'success');
        setRows(prev => prev.filter(r => r.leave_id !== leave_id));
      } else {
        showSnackbar?.(data.message || 'Action failed', 'error');
      }
    } catch (e) {
      showSnackbar?.('Network error', 'error');
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const MobileView = () => (
    <Stack spacing={2}>
      {rows.map(r => (
        <Card key={r.leave_id} variant="outlined" sx={{ borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>{r.leave_type}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={() => act(r.leave_id, 'approve')}
                  >Approve</Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => act(r.leave_id, 'reject')}
                  >Reject</Button>
                </Stack>
              </Stack>
              <Divider />
              <Typography variant="body2"><strong>User:</strong> {r.user_id}</Typography>
              <Typography variant="body2"><strong>Dates:</strong> {r.start_date} → {r.end_date}</Typography>
              {r.reason && <Typography variant="body2" color="text.secondary">{r.reason}</Typography>}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Pending Leave Requests</Typography>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && rows.length === 0 && <div>No pending leaves.</div>}
      {!loading && rows.length > 0 && (
        isMobile ? (
          <MobileView />
        ) : (
          <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.leave_id}>
                    <TableCell>{r.user_id}</TableCell>
                    <TableCell>{r.leave_type}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" noWrap title={r.reason}>{r.reason}</Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={() => act(r.leave_id, 'approve')}
                        sx={{ bgcolor: 'success.main', color: 'success.contrastText', '&:hover': { bgcolor: 'success.dark' } }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ ml: 1, bgcolor: 'error.main', color: 'error.contrastText', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={() => act(r.leave_id, 'reject')}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
    </Box>
  );
};

export default PendingLeaves;
