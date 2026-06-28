import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  outline: 'none', fontSize: 14, background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
};
const focusI = (e: React.FocusEvent<HTMLInputElement>) =>
  Object.assign(e.currentTarget.style, { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' });
const blurI  = (e: React.FocusEvent<HTMLInputElement>) =>
  Object.assign(e.currentTarget.style, { borderColor: '#e2e8f0', boxShadow: 'none' });

const ChangePassword: React.FC = () => {
  const { token } = useAuth();

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (next.length < 8)         { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm)        { setError('New passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.put(
        `${API_BASE}/vendor-portal/me/password`,
        { currentPassword: current, newPassword: next },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess('Password updated successfully.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 md:p-6 max-w-md">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Change Password</h1>
        <p className="text-slate-500 text-sm mt-0.5">Update your account password</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Password</label>
            <input
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              onFocus={focusI}
              onBlur={blurI}
              required
              autoComplete="current-password"
              placeholder="Enter current password"
              style={inp}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
            <input
              type="password"
              value={next}
              onChange={e => setNext(e.target.value)}
              onFocus={focusI}
              onBlur={blurI}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              style={inp}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onFocus={focusI}
              onBlur={blurI}
              required
              autoComplete="new-password"
              placeholder="Repeat new password"
              style={inp}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !current || !next || !confirm}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
