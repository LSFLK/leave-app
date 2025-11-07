import React, { useState } from 'react';
 import { getToken } from './token';
 import { apiFetch, parseJsonSafe } from './api';

interface LeavePayload {
  leave_id: string;
  // user_id removed from form state, will be added from authenticated user
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

interface LeaveRequestFormProps {
  showSnackbar?: (message: string, type?: 'success' | 'error') => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ showSnackbar }) => {
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
  const [form, setForm] = useState<Omit<LeavePayload, 'user_id'>>({
    leave_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    reason?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    // Cross-field: keep end_date >= start_date
    if ((name === 'start_date' && form.end_date) || (name === 'end_date' && form.start_date)) {
      const start = name === 'start_date' ? value : form.start_date;
      const end = name === 'end_date' ? value : form.end_date;
      if (start && end && new Date(end) < new Date(start)) {
        setErrors(prev => ({ ...prev, end_date: 'End date cannot be before start date' }));
      } else {
        setErrors(prev => ({ ...prev, end_date: undefined }));
      }
    }
  };

  // Generate a UUID for leave_id
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    // Validate before submit
    const newErrors: typeof errors = {};
    const allowedTypes = ['annual', 'sick', 'casual'];
    if (!form.leave_type || !allowedTypes.includes(form.leave_type)) newErrors.leave_type = 'Please select a valid leave type';
    if (!form.start_date) newErrors.start_date = 'Start date is required';
    if (!form.end_date) newErrors.end_date = 'End date is required';
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) newErrors.end_date = 'End date cannot be before start date';
    const reasonTrim = form.reason.trim();
    if (!reasonTrim) newErrors.reason = 'Reason is required';
    else if (reasonTrim.length < 10) newErrors.reason = 'Reason must be at least 10 characters';
    else if (reasonTrim.length > 500) newErrors.reason = 'Reason must be at most 500 characters';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (showSnackbar) showSnackbar('Please fix the highlighted errors', 'error');
      return;
    }
    const leave_id = generateUUID();
    // Get employeeId from JWT token (email)
    const token = await getToken();
    if (!token) {
      setError('Missing auth token');
      return;
    }
    const employeeId = getEmailFromJWT(token) || '';
    try {
      const payload = { ...form, leave_id, status: 'pending', user_id: employeeId };
      const res = await apiFetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafe<any>(res);
      if (data.status === 'success') {
        setStatus(data.message);
        if (showSnackbar) showSnackbar(data.message, 'success');
      } else {
        setError(data.message || 'Failed to submit leave request');
        if (showSnackbar) showSnackbar(data.message || 'Failed to submit leave request', 'error');
      }
    } catch (err) {
      setError('Network error');
      if (showSnackbar) showSnackbar('Network error', 'error');
    }
  };

  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 400,
          background: 'inherit',
          padding: '2rem',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
        }}
      >
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: grayscale(1) brightness(0.6);
          }
        `}</style>
  <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Submit Leave Request</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="leave_type" style={{ fontWeight: 500 }}>Leave Type</label>
          <select
            id="leave_type"
            name="leave_type"
            value={form.leave_type}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', background: 'inherit', color: 'inherit' }}
          >
            <option value="">Select type</option>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="casual">Casual</option>
          </select>
          {errors.leave_type && <small style={{ color: '#e74c3c' }}>{errors.leave_type}</small>}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="start_date" style={{ fontWeight: 500 }}>Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', background: 'inherit', color: 'inherit' }}
            />
      {errors.start_date && <small style={{ color: '#e74c3c' }}>{errors.start_date}</small>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="end_date" style={{ fontWeight: 500 }}>End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                required
        min={form.start_date || undefined}
        style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', background: 'inherit', color: 'inherit' }}
              />
      {errors.end_date && <small style={{ color: '#e74c3c' }}>{errors.end_date}</small>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="reason" style={{ fontWeight: 500 }}>Reason</label>
          <textarea
            id="reason"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            required
            placeholder="Describe your reason for leave"
            rows={3}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', resize: 'vertical', background: 'inherit', color: 'inherit' }}
          />
          {errors.reason && <small style={{ color: '#e74c3c' }}>{errors.reason}</small>}
        </div>

  <button
          type="submit"
          style={{
            background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            padding: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
            transition: 'background 0.2s',
          }}
        >
          Submit Request
        </button>

        {status && <div style={{ color: '#27ae60', textAlign: 'center', marginTop: 8, fontWeight: 500 }}>{status}</div>}
        {error && <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: 8, fontWeight: 500 }}>{error}</div>}
      </form>
    </div>
  );
};

export default LeaveRequestForm;
