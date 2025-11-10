import { getToken } from './token';
import { apiFetch, parseJsonSafe } from './api';
import React, { useState } from 'react';

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

interface LeaveListProps {
  showSnackbar?: (message: string, type?: 'success' | 'error') => void;
  isAdmin?: boolean;
}

const LeaveList: React.FC<LeaveListProps> = ({ showSnackbar, isAdmin = false }) => {
  // Search state
  const [searchField, setSearchField] = useState('type');
  const [searchValue, setSearchValue] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Allowances (persisted locally so Reports can read them too)
  const [allowAnnual, setAllowAnnual] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-annual') : null;
    return v ? parseInt(v) : 20;
  });
  const [allowSick, setAllowSick] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-sick') : null;
    return v ? parseInt(v) : 10;
  });
  const [allowCasual, setAllowCasual] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('allow-casual') : null;
    return v ? parseInt(v) : 7;
  });
  React.useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem('allow-annual', String(allowAnnual)); }, [allowAnnual]);
  React.useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem('allow-sick', String(allowSick)); }, [allowSick]);
  React.useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem('allow-casual', String(allowCasual)); }, [allowCasual]);

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ leave_type: string; start_date: string; end_date: string; reason: string }>({
    leave_type: '', start_date: '', end_date: '', reason: ''
  });

  // Filtered leaves
  const filteredLeaves = leaves.filter(leave => {
    if (!searchValue) return true;
    const value = searchValue.toLowerCase();
    switch (searchField) {
      case 'type':
        return leave.leave_type.toLowerCase().includes(value);
      case 'status':
        return leave.status.toLowerCase().includes(value);
      case 'start_date':
        return leave.start_date.includes(value);
      case 'end_date':
        return leave.end_date.includes(value);
      case 'reason':
        return leave.reason.toLowerCase().includes(value);
      default:
        return true;
    }
  });

  async function handleDelete(leaveId: string) {
    if (!window.confirm('Delete this leave request? This cannot be undone.')) return;
    setDeleting(d => ({ ...d, [leaveId]: true }));
    try {
      const token = jwtToken;
      if (!token) throw new Error('Missing auth token');
      const res = await apiFetch(`/api/leaves/${encodeURIComponent(leaveId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonSafe<any>(res);
      if (data.status === 'success') {
        setLeaves(ls => ls.filter(l => l.leave_id !== leaveId));
        showSnackbar && showSnackbar('Leave deleted', 'success');
      } else {
        showSnackbar && showSnackbar(data.message || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showSnackbar && showSnackbar(e?.message || 'Network error', 'error');
    }
    setDeleting(d => ({ ...d, [leaveId]: false }));
  }

  function startEdit(leave: Leave) {
    setEditingId(leave.leave_id);
    setEditForm({
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason || ''
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(leaveId: string) {
    // basic validation
    if (!editForm.leave_type || !editForm.start_date || !editForm.end_date) {
      showSnackbar && showSnackbar('Type, Start and End are required', 'error');
      return;
    }
    if (editForm.end_date < editForm.start_date) {
      showSnackbar && showSnackbar('End date cannot be before start date', 'error');
      return;
    }
    try {
      const token = jwtToken;
      if (!token) throw new Error('Missing auth token');
      const res = await apiFetch(`/api/leaves/${encodeURIComponent(leaveId)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await parseJsonSafe<any>(res);
      if (data.status === 'success') {
        setLeaves(ls => ls.map(l => l.leave_id === leaveId ? { ...l, ...editForm } as Leave : l));
        setEditingId(null);
        showSnackbar && showSnackbar('Leave updated', 'success');
      } else {
        showSnackbar && showSnackbar(data.message || 'Update failed', 'error');
      }
    } catch (e: any) {
      showSnackbar && showSnackbar(e?.message || 'Network error', 'error');
    }
  }


  // Helper to decode JWT and extract email
  function getEmailFromJWT(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded.email || null;
    } catch {
      return null;
    }
  }
  const [jwtToken, setJwtToken] = React.useState<string>('');
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
  const t = await getToken();
  if (!mounted) return;
  const safeToken = t || '';
  setJwtToken(safeToken);
  setUserEmail(safeToken ? getEmailFromJWT(safeToken) : null);
      } catch (e) {
        if (mounted) {
          setError('JWT token unavailable');
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);


  // Fetch all leaves for the user on mount


  React.useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!userEmail) {
          setError('User email not found in JWT');
          setLoading(false);
          return;
        }
        const url = `/api/leaves?user_id=${encodeURIComponent(userEmail)}`;
        const token = jwtToken;
        if (!token) {
          setError('Auth token missing');
          setLoading(false);
          return;
        }
        const res = await apiFetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await parseJsonSafe<any>(res);
        if (data.status === 'success') {
          setLeaves(data.data);
        } else {
          setError(data.message || 'Failed to fetch leaves');
          if (showSnackbar) showSnackbar(data.message || 'Failed to fetch leaves', 'error');
        }
      } catch (err: any) {
        const msgParts: string[] = [];
        if (err) {
          if (typeof err.message === 'string' && err.message) msgParts.push(err.message);
          if (err.timeout) msgParts.push('(timeout)');
          else if (err.network) msgParts.push('(network)');
        }
        const friendly = msgParts.length ? msgParts.join(' ') : 'Network error';
        setError(friendly);
        if (showSnackbar) showSnackbar(friendly, 'error');
        console.error('Fetch leaves failed', err);
      }
      setLoading(false);
    };
    fetchLeaves();
  }, [userEmail, jwtToken]);

  return (
    <div className="leave-list-root" style={{ padding: 16, width: '100%', alignItems: 'center', boxSizing: 'border-box' }}>
      <div className="allowances-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="allow_annual" style={{ fontSize: 12, opacity: 0.8 }}>Annual allowance</label>
          <input
            id="allow_annual"
            type="number"
            value={allowAnnual}
            onChange={e => setAllowAnnual(parseInt(e.target.value || '0'))}
            disabled={!isAdmin}
            style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 140, background: 'inherit', color: 'inherit' }}
          />
          {!isAdmin && <small style={{ opacity: 0.7 }}></small>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="allow_sick" style={{ fontSize: 12, opacity: 0.8 }}>Sick allowance</label>
          <input
            id="allow_sick"
            type="number"
            value={allowSick}
            onChange={e => setAllowSick(parseInt(e.target.value || '0'))}
            disabled={!isAdmin}
            style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 140, background: 'inherit', color: 'inherit' }}
          />
          {!isAdmin && <small style={{ opacity: 0.7 }}></small>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="allow_casual" style={{ fontSize: 12, opacity: 0.8 }}>Casual allowance</label>
          <input
            id="allow_casual"
            type="number"
            value={allowCasual}
            onChange={e => setAllowCasual(parseInt(e.target.value || '0'))}
            disabled={!isAdmin}
            style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 140, background: 'inherit', color: 'inherit' }}
          />
          {!isAdmin && <small style={{ opacity: 0.7 }}></small>}
        </div>
      </div>
  <h2 style={{ marginTop: 0, marginBottom: 12 }}>My Leaves</h2>
  <div className="search-row" style={{ margin: '16px 0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', minWidth: 120, background: 'inherit', color: 'inherit' }}
        >
          <option value="type">Type</option>
          <option value="status">Status</option>
          <option value="start_date">Start Date</option>
          <option value="end_date">End Date</option>
          <option value="reason">Reason</option>
        </select>
        <input
          type={searchField === 'start_date' || searchField === 'end_date' ? 'date' : 'text'}
          placeholder={`Search by ${searchField.replace('_', ' ')}`}
          value={searchValue}
          onChange={e => {
            const v = e.target.value;
            if (v.length > 100) {
              setSearchError('Search is too long');
            } else {
              setSearchError(null);
            }
            setSearchValue(v);
          }}
          style={{ padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', minWidth: 160, background: 'inherit', color: 'inherit' }}
        />
  {searchError && <small style={{ color: 'red' }}>{searchError}</small>}
      </div>
      {loading && <div>Loading leaves...</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {filteredLeaves.length > 0 ? (
        <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Start Date</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>End Date</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Reason</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map(leave => {
              const isEditing = editingId === leave.leave_id;
              return (
                <tr key={leave.leave_id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.leave_type}
                        onChange={e => setEditForm(f => ({ ...f, leave_type: e.target.value }))}
                        style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 140, background: 'inherit', color: 'inherit' }}
                      />
                    ) : (
                      leave.leave_type
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.status}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))}
                        style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 160, background: 'inherit', color: 'inherit' }}
                      />
                    ) : (
                      leave.start_date
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))}
                        style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 160, background: 'inherit', color: 'inherit' }}
                      />
                    ) : (
                      leave.end_date
                    )}
                  </td>
                  <td className="reason-cell" style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)', maxWidth: 320 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.reason}
                        onChange={e => setEditForm(f => ({ ...f, reason: e.target.value }))}
                        style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', width: 280, background: 'inherit', color: 'inherit' }}
                      />
                    ) : (
                      leave.reason
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(leave.leave_id)}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#777', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(leave)}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#0288d1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(leave.leave_id)}
                          disabled={deleting[leave.leave_id]}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: deleting[leave.leave_id] ? '#999' : '#d32f2f',
                            color: '#fff',
                            border: 'none',
                            cursor: deleting[leave.leave_id] ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: 0.4,
                          }}
                        >
                          {deleting[leave.leave_id] ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      ) : (
        !loading && <div>No leaves found.</div>
      )}
      <style>{`
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(0.2);
  }
  /* Responsive layout */
  @media (max-width: 900px) {
    .allowances-row input { width: 120px; }
  }
  @media (max-width: 700px) {
    .leave-list-root { padding: 14px; }
    .allowances-row { gap: 10px; }
    .search-row { gap: 10px; }
    table { font-size: 13px; }
  }
  @media (max-width: 600px) {
    .leave-list-root { padding: 12px; }
    .allowances-row > div { flex: 1 1 100%; max-width: 100%; }
    .allowances-row input { width: 100% !important; }
    .search-row { flex-direction: column; align-items: stretch; }
    .search-row select, .search-row input { width: 100%; }
    table { min-width: 600px; }
    th, td { padding: 8px 6px !important; }
    .reason-cell { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  }
  @media (max-width: 420px) {
    h2 { font-size: 1.15rem; }
    table { font-size: 12px; }
    .reason-cell { max-width: 140px; }
  }
`}</style>
    </div>
  );
};

export default LeaveList;
