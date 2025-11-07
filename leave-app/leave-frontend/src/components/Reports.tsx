import React from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { getToken } from '../token';
import { apiFetch, parseJsonSafe } from '../api';

type Leave = {
  leave_id: string;
  user_id: string;
  leave_type: 'annual' | 'sick' | 'casual' | string;
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  reason: string;
  status: string;
  created_at: string;
};

function daysBetweenInclusive(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? Math.floor(diff) + 1 : 0;
}

const typeOptions = ['all', 'annual', 'sick', 'casual'] as const;
type TypeFilter = typeof typeOptions[number];
const statusOptions = ['approved', 'pending', 'rejected', 'all'] as const;
type StatusFilter = typeof statusOptions[number];

type ReportsProps = { isAdmin?: boolean };
const Reports: React.FC<ReportsProps> = ({ isAdmin }) => {
  const [rows, setRows] = React.useState<Leave[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<StatusFilter>('approved');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [type, setType] = React.useState<TypeFilter>('all');
  const [scope, setScope] = React.useState<'me'|'org'>(isAdmin ? 'org' : 'me');
  const [employee, setEmployee] = React.useState('');
  const [mode, setMode] = React.useState<'rows'|'employee-summary'>('rows');
  const allowAnnual = React.useMemo(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-annual') : null;
    return v ? parseInt(v) : 20;
  }, []);
  const allowSick = React.useMemo(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-sick') : null;
    return v ? parseInt(v) : 10;
  }, []);
  const allowCasual = React.useMemo(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-casual') : null;
    return v ? parseInt(v) : 7;
  }, []);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (type) params.set('type', type);
        if (status) params.set('status', status);
        if (scope === 'org' && isAdmin && employee.trim()) params.set('employee', employee.trim());
        const url = scope === 'org' && isAdmin ? `/api/admin/leaves?${params.toString()}` : `/api/leaves`;
        const token = await getToken();
        if (!token) { setError('Missing auth token'); setLoading(false); return; }
        const res = await apiFetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await parseJsonSafe<any>(res);
        if (data.status === 'success') setRows(data.data || []);
        else setError(data.message || 'Failed to load');
      } catch (e) {
        setError('Network error');
      }
      setLoading(false);
    };
    run();
  }, [scope, isAdmin, start, end, type, status, employee]);

  const filtered = rows.filter(r => {
    const rStatus = (r.status || '').toLowerCase();
    if (status !== 'all' && rStatus !== status) return false;
    if (type !== 'all' && r.leave_type !== type) return false;
    if (start && r.end_date < start) return false;
    if (end && r.start_date > end) return false;
    if (scope === 'org' && isAdmin && employee.trim()) {
      if (r.user_id.toLowerCase() !== employee.trim().toLowerCase()) return false;
    }
    return true;
  });

  const totalDays = filtered.reduce((acc, r) => acc + daysBetweenInclusive(r.start_date, r.end_date), 0);
  const takenByType: Record<string, number> = {};
  filtered.forEach(r => {
    const d = daysBetweenInclusive(r.start_date, r.end_date);
    takenByType[r.leave_type] = (takenByType[r.leave_type] || 0) + d;
  });
  const allowances: Record<string, number> = {
    annual: allowAnnual,
    sick: allowSick,
    casual: allowCasual,
  };
  const remainingByType: Record<string, number> = Object.fromEntries(
    Object.entries(allowances).map(([k, v]) => [k, Math.max(0, v - (takenByType[k] || 0))])
  );

  type EmpSummary = {
    totalDays: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    requests: number;
  };
  function buildEmployeeSummary(): Record<string, EmpSummary> {
    const map: Record<string, EmpSummary> = {};
    for (const r of filtered) {
      const emp = r.user_id || 'unknown';
      const d = daysBetweenInclusive(r.start_date, r.end_date);
      if (!map[emp]) {
        map[emp] = { totalDays: 0, byType: {}, byStatus: {}, requests: 0 };
      }
      map[emp].totalDays += d;
      map[emp].requests += 1;
      map[emp].byType[r.leave_type] = (map[emp].byType[r.leave_type] || 0) + d;
      const st = (r.status || '').toLowerCase();
      map[emp].byStatus[st] = (map[emp].byStatus[st] || 0) + 1;
    }
    return map;
  }

  function exportCSV() {
    if (isAdmin && scope === 'org' && mode === 'employee-summary') {
      const summary = buildEmployeeSummary();
      const header = ['Employee','Total Days','Annual','Sick','Casual','Approved','Pending','Rejected','Requests'];
      const lines = Object.entries(summary).map(([emp, s]) => [
        emp,
        s.totalDays,
        s.byType.annual || 0,
        s.byType.sick || 0,
        s.byType.casual || 0,
        s.byStatus.approved || 0,
        s.byStatus.pending || 0,
        s.byStatus.rejected || 0,
        s.requests
      ]);
      const csv = [header, ...lines]
        .map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_leave_summary.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const header = scope === 'org' && isAdmin
      ? ['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason']
      : ['Type', 'Start', 'End', 'Days', 'Status', 'Reason'];
    const lines = filtered.map(r => {
      const base = [
        r.leave_type,
        r.start_date,
        r.end_date,
        daysBetweenInclusive(r.start_date, r.end_date).toString(),
        r.status,
        (r.reason || '').replace(/\n/g, ' ')
      ];
      return scope === 'org' && isAdmin ? [r.user_id, ...base] : base;
    });
    const summary = [
      [],
      ['Summary'],
      ['Total Days', totalDays.toString()],
      ['Remaining Annual', remainingByType.annual?.toString() ?? ''],
      ['Remaining Sick', remainingByType.sick?.toString() ?? ''],
      ['Remaining Casual', remainingByType.casual?.toString() ?? ''],
    ];
    const csv = [header, ...lines, ...summary]
      .map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (isAdmin && scope === 'org' && mode === 'employee-summary') {
      const summary = buildEmployeeSummary();
      const rowsHtml = Object.entries(summary).map(([emp, s]) => `
        <tr>
          <td>${emp}</td>
          <td>${s.totalDays}</td>
          <td>${s.byType.annual || 0}</td>
          <td>${s.byType.sick || 0}</td>
          <td>${s.byType.casual || 0}</td>
          <td>${s.byStatus.approved || 0}</td>
          <td>${s.byStatus.pending || 0}</td>
          <td>${s.byStatus.rejected || 0}</td>
          <td>${s.requests}</td>
        </tr>
      `).join('');
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
        <title>Employee Leave Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head><body>
        <h1>Employee Leave Summary</h1>
        <div><strong>Filters:</strong> ${start || 'Any'} to ${end || 'Any'}, Type: ${type}${employee ? ', Employee filter: ' + employee : ''}</div>
        <table>
          <thead>
            <tr><th>Employee</th><th>Total Days</th><th>Annual</th><th>Sick</th><th>Casual</th><th>Approved</th><th>Pending</th><th>Rejected</th><th>Requests</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = () => window.print();<\/script>
      </body></html>`);
      w.document.close();
      w.focus();
      return;
    }
    // Lightweight: open a print-friendly window for PDF export via browser
  const htmlRows = filtered.map(r => `
      <tr>
    ${scope === 'org' && isAdmin ? `<td>${r.user_id}</td>` : ''}
    <td>${r.leave_type}</td>
        <td>${r.start_date}</td>
        <td>${r.end_date}</td>
        <td>${daysBetweenInclusive(r.start_date, r.end_date)}</td>
        <td>${r.status}</td>
        <td>${(r.reason || '').replace(/</g, '&lt;')}</td>
      </tr>
    `).join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Leave Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h1 { margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; }
      </style>
    </head><body>
      <h1>Leave Report</h1>
    <div><strong>Filters:</strong> ${start || 'Any'} to ${end || 'Any'}, Type: ${type}${scope === 'org' && isAdmin ? `, Employee: ${employee || 'Any'}` : ''}</div>
      <table>
        <thead>
      <tr>${scope === 'org' && isAdmin ? '<th>Employee</th>' : ''}<th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Reason</th></tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
      <h2>Summary</h2>
      <div>Total Days: ${totalDays}</div>
      <div>Remaining - Annual: ${remainingByType.annual ?? ''}, Sick: ${remainingByType.sick ?? ''}, Casual: ${remainingByType.casual ?? ''}</div>
      <script>window.onload = () => window.print();<\/script>
    </body></html>`);
    w.document.close();
    w.focus();
  }

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Leave Reports</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          {isAdmin && (
            <ToggleButtonGroup size="small" exclusive value={scope} onChange={(_, v) => v && setScope(v)}>
              <ToggleButton value="me">My history</ToggleButton>
              <ToggleButton value="org">Organization</ToggleButton>
            </ToggleButtonGroup>
          )}
          {isAdmin && scope === 'org' && (
            <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
              <ToggleButton value="rows">Rows</ToggleButton>
              <ToggleButton value="employee-summary">Employee summary</ToggleButton>
            </ToggleButtonGroup>
          )}
          <TextField
            type="date"
            label="Start"
            InputLabelProps={{ shrink: true }}
            value={start}
            onChange={e => setStart(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <TextField
            type="date"
            label="End"
            InputLabelProps={{ shrink: true }}
            value={end}
            onChange={e => setEnd(e.target.value)}
            inputProps={{ min: start || undefined }}
            sx={{ minWidth: 180 }}
          />
          <TextField select label="Type" value={type} onChange={e => setType(e.target.value as TypeFilter)} sx={{ minWidth: 160 }}>
            {typeOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt === 'all' ? 'All Types' : opt[0].toUpperCase() + opt.slice(1)}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Status" value={status} onChange={e => setStatus(e.target.value as StatusFilter)} sx={{ minWidth: 160 }}>
            {statusOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt === 'all' ? 'All Statuses' : opt[0].toUpperCase() + opt.slice(1)}</MenuItem>
            ))}
          </TextField>
          {isAdmin && scope === 'org' && (
            <TextField label="Employee (email)" value={employee} onChange={e => setEmployee(e.target.value)} placeholder="user@company.com" sx={{ minWidth: 220 }} />
          )}
        </Stack>
        <Divider sx={{ my: 2 }} />
    <Typography variant="body2" color="text.secondary">Allowances — Annual: {allowAnnual}, Sick: {allowSick}, Casual: {allowCasual}</Typography>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
        <Button variant="outlined" onClick={exportPDF}>Export PDF</Button>
      </Stack>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && mode === 'rows' && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {isAdmin && scope === 'org' && <TableCell>Employee</TableCell>}
                <TableCell>Type</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.leave_id}>
                  {isAdmin && scope === 'org' && <TableCell>{r.user_id}</TableCell>}
                  <TableCell>{r.leave_type}</TableCell>
                  <TableCell>{r.start_date}</TableCell>
                  <TableCell>{r.end_date}</TableCell>
                  <TableCell>{daysBetweenInclusive(r.start_date, r.end_date)}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && isAdmin && scope === 'org' && mode === 'employee-summary' && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Annual</TableCell>
                <TableCell>Sick</TableCell>
                <TableCell>Casual</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Rejected</TableCell>
                <TableCell>Requests</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(buildEmployeeSummary()).map(([emp, s]) => (
                <TableRow key={emp}>
                  <TableCell>{emp}</TableCell>
                  <TableCell>{s.totalDays}</TableCell>
                  <TableCell>{s.byType.annual || 0}</TableCell>
                  <TableCell>{s.byType.sick || 0}</TableCell>
                  <TableCell>{s.byType.casual || 0}</TableCell>
                  <TableCell>{s.byStatus.approved || 0}</TableCell>
                  <TableCell>{s.byStatus.pending || 0}</TableCell>
                  <TableCell>{s.byStatus.rejected || 0}</TableCell>
                  <TableCell>{s.requests}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Summary</Typography>
        <Typography>Total Days Taken (filtered): {totalDays}</Typography>
        <Typography>Remaining — Annual: {remainingByType.annual ?? 0}, Sick: {remainingByType.sick ?? 0}, Casual: {remainingByType.casual ?? 0}</Typography>
      </Paper>
    </Box>
  );
};

export default Reports;
