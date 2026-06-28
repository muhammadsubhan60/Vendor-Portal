import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api';

const CARRIER_COLOR: Record<string, string> = {
  USPS:  'bg-blue-100 text-blue-700',
  UPS:   'bg-amber-100 text-amber-700',
  FedEx: 'bg-purple-100 text-purple-700',
  DHL:   'bg-yellow-100 text-yellow-800',
};

const Earnings: React.FC = () => {
  const { token }  = useAuth();
  const [data,     setData]    = useState<any>(null);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/vendor-portal/earnings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your completed jobs and payable balance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Payable Balance', value: `$${(data?.payableBalance ?? 0).toFixed(2)}`, color: 'text-emerald-600' },
          { label: 'Total Paid Out',  value: `$${(data?.totalPaidOut  ?? 0).toFixed(2)}`, color: 'text-blue-600'    },
          { label: 'Rate / Label',    value: `$${(data?.vendorRate    ?? 0).toFixed(2)}`, color: 'text-amber-600'   },
          { label: 'Jobs Completed',  value: data?.jobs?.length ?? 0,                     color: 'text-indigo-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payout history */}
      {data?.payouts?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payout History</h3>
          <div className="space-y-2">
            {data.payouts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-slate-800">${(p.amount ?? 0).toFixed(2)} paid</div>
                  <div className="text-xs text-slate-400">{p.note || 'Payout'}</div>
                </div>
                <div className="text-xs text-slate-400">{p.date ? new Date(p.date).toLocaleDateString() : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed jobs */}
      {data?.jobs?.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed Jobs</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Job ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Carrier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Labels</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Earned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.jobs.map((job: any) => (
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
                  <td className="px-4 py-3 text-slate-600">
                    ${(job.vendorEarning?.ratePerLabel ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    ${(job.vendorEarning?.totalAmount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-16 flex flex-col items-center text-slate-400">
          <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-sm font-medium">No completed jobs yet</span>
        </div>
      )}
    </div>
  );
};

export default Earnings;
