import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api';

const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open — Claim It',     color: '#0891b2', bg: '#ecfeff' },
  assigned:     { label: 'Claimed',             color: '#d97706', bg: '#fffbeb' },
  accepted:     { label: 'In Progress',         color: '#2563eb', bg: '#eff6ff' },
  uploaded:     { label: 'Submitted (cooling)', color: '#7c3aed', bg: '#f5f3ff' },
  under_review: { label: 'Under Review',        color: '#6366f1', bg: '#eef2ff' },
  completed:    { label: 'Completed',           color: '#059669', bg: '#ecfdf5' },
  cancelled:    { label: 'Cancelled',           color: '#dc2626', bg: '#fef2f2' },
  rejected:     { label: 'Re-upload Required',  color: '#ea580c', bg: '#fff7ed' },
};

const CARRIER_COLOR: Record<string, string> = {
  USPS:  'bg-blue-100 text-blue-700',
  UPS:   'bg-amber-100 text-amber-700',
  FedEx: 'bg-purple-100 text-purple-700',
  DHL:   'bg-yellow-100 text-yellow-800',
};

const FILTERS = ['', 'open', 'assigned', 'accepted', 'uploaded', 'under_review', 'completed', 'rejected'];
const FILTER_LABELS: Record<string, string> = {
  '': 'All', open: 'Open', assigned: 'Claimed', accepted: 'In Progress',
  uploaded: 'Submitted', under_review: 'Under Review', completed: 'Completed', rejected: 'Re-upload',
};

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [jobs,         setJobs]         = useState<any[]>([]);
  const [vendorInfo,   setVendorInfo]   = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API_BASE}/vendor-portal/jobs`, { headers, params });
      setJobs(data.jobs);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      // silent — error state shown via empty list
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    axios.get(`${API_BASE}/vendor-portal/me`, { headers })
      .then(r => setVendorInfo(r.data.vendor))
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeJobs  = jobs.filter(j => ['assigned', 'accepted'].includes(j.status)).length;
  const pendingJobs = jobs.filter(j => j.status === 'open').length;

  return (
    <div className="p-6 max-w-6xl">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage label fulfillment jobs assigned to you</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open for Claim', value: pendingJobs, color: 'text-cyan-600' },
          { label: 'In Progress',    value: activeJobs,  color: 'text-blue-600' },
          { label: 'Total Jobs',     value: total,       color: 'text-indigo-600' },
          { label: 'Payable Balance',value: `$${(vendorInfo?.payableBalance ?? 0).toFixed(2)}`, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button
            key={f || 'all'}
            onClick={() => { setStatusFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === f
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-slate-400 text-sm">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <span className="font-medium text-sm">No jobs found</span>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Job ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Carrier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Labels</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Earning</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.map((job: any) => {
                  const st = STATUSES[job.status] || { label: job.status, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <tr key={job._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {job._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${CARRIER_COLOR[job.carrier] || 'bg-slate-100 text-slate-600'}`}>
                          {job.carrier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {job.requestFile?.labelCount ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        ${(job.vendorEarning?.totalAmount ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/jobs/${job._id}`}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                            job.status === 'open'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {job.status === 'open' ? 'Accept →' : 'View →'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:border-slate-300 transition"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500">{page} / {pages}</span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:border-slate-300 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
