import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api';

// ── Simple SVG bar chart for weekly earnings ──────────────────────────────
const WeeklyChart = ({ jobs }: { jobs: any[] }) => {
  const now   = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(now);
    start.setDate(start.getDate() - 7 * (7 - i) - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const total = jobs
      .filter(j => j.completedAt && new Date(j.completedAt) >= start && new Date(j.completedAt) < end)
      .reduce((sum, j) => sum + (j.vendorEarning?.totalAmount || 0), 0);
    return { label, total };
  });

  const max   = Math.max(...weeks.map(w => w.total), 1);
  const W     = 420, H = 140, PAD_B = 28, PAD_T = 12, BAR_W = 36;
  const GAP   = (W - BAR_W * 8) / 9;

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_B}`} className="w-full" style={{ maxHeight: 180 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD_T + (1 - t) * H;
        return (
          <g key={t}>
            <line x1={0} y1={y} x2={W} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            {t > 0 && <text x={2} y={y - 2} fontSize={8} fill="#cbd5e1">${(max * t).toFixed(0)}</text>}
          </g>
        );
      })}
      {weeks.map((w, i) => {
        const x    = GAP + i * (BAR_W + GAP);
        const barH = w.total > 0 ? Math.max(4, (w.total / max) * H) : 2;
        const y    = PAD_T + H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={4} fill={w.total > 0 ? '#6366f1' : '#f1f5f9'} />
            {w.total > 0 && (
              <text x={x + BAR_W / 2} y={y - 3} fontSize={8} fill="#6366f1" textAnchor="middle">
                ${w.total.toFixed(0)}
              </text>
            )}
            <text x={x + BAR_W / 2} y={PAD_T + H + 16} fontSize={8} fill="#94a3b8" textAnchor="middle">
              {w.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const Earnings: React.FC = () => {
  const { token }  = useAuth();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/vendor-portal/earnings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 min-h-64 text-slate-400 text-sm">
        <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  const jobs        = data?.jobs ?? [];
  const totalLabels = jobs.reduce((s: number, j: any) => s + (j.requestFile?.labelCount || 0), 0);
  const totalEarned = jobs.reduce((s: number, j: any) => s + (j.vendorEarning?.totalAmount || 0), 0);
  const avgEarning  = jobs.length > 0 ? totalEarned / jobs.length : 0;

  return (
    <div className="p-5 md:p-6 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your completed jobs and payment summary</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Payable Balance', value: `$${(data?.payableBalance ?? 0).toFixed(2)}`, color: 'text-emerald-600', sub: 'Ready for payout' },
          { label: 'Total Paid Out',  value: `$${(data?.totalPaidOut  ?? 0).toFixed(2)}`, color: 'text-blue-600',    sub: 'Lifetime received' },
          { label: 'Total Labels',    value: totalLabels.toLocaleString(),                 color: 'text-indigo-600',  sub: 'Labels processed' },
          { label: 'Avg per Job',     value: `$${avgEarning.toFixed(2)}`,                 color: 'text-amber-600',   sub: `Over ${jobs.length} jobs` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Weekly Earnings — Last 8 Weeks</h3>
          <WeeklyChart jobs={jobs} />
        </div>
      )}

      {/* Job history */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Completed Jobs</h3>
        </div>
        {jobs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span className="font-medium text-sm">No completed jobs yet</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Job ID', 'Carrier', 'Labels', 'Rate', 'Earned', 'Completed'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.map((job: any) => (
                  <tr key={job._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{job._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">{job.carrier}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{job.requestFile?.labelCount ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">${(job.vendorEarning?.ratePerLabel ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">${(job.vendorEarning?.totalAmount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">${totalEarned.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
