import { getToken } from './token';
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
        setJwtToken(t);
        setUserEmail(getEmailFromJWT(t));
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
        // Always fetch leaves by user_id only, never send status
        if (!userEmail) {
          setError('User email not found in JWT');
          setLoading(false);
          return;
        }
        const url = `/api/leaves?user_id=${encodeURIComponent(userEmail)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'x-jwt-assertion': jwtToken,
          },
        });
        const data = await res.json();
        if (data.status === 'success') {
          setLeaves(data.data);
        } else {
          setError(data.message || 'Failed to fetch leaves');
          if (showSnackbar) showSnackbar(data.message || 'Failed to fetch leaves', 'error');
        }
      } catch (err) {
        setError('Network error');
        if (showSnackbar) showSnackbar('Network error', 'error');
      }
      setLoading(false);
    };
    fetchLeaves();
  }, [userEmail, jwtToken]);

  return (
    <div style={{ padding: 40, width: '100%', alignItems: 'center', paddingRight: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
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
      <h2>My Leaves</h2>
      <div style={{ margin: '16px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
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
        <table style={{ width: '95%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Start Date</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>End Date</th>
              <th style={{ padding: '12px 8px', borderBottom: '1px solid rgba(0,0,0,0.2)', textAlign: 'left' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map(leave => (
              <tr key={leave.leave_id}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.leave_type}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.status}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.start_date}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.end_date}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>{leave.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div>No leaves found.</div>
      )}
      <style>{`
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(0.2);
  }
`}</style>
    </div>
  );
};

export default LeaveList;
