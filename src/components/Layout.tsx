import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const CoinsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const BatchOpsLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const Layout: React.FC = () => {
  const { vendor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initial = vendor?.name?.charAt(0).toUpperCase() ?? '?';

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all ${
      isActive
        ? 'bg-indigo-500/20 text-white border-l-0'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-56 fixed top-0 bottom-0 left-0 flex flex-col bg-slate-900 border-r border-white/[0.06]">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <BatchOpsLogo />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 leading-tight">BatchOps</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Vendor Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/jobs"     className={navClass}><BriefcaseIcon /> My Jobs</NavLink>
          <NavLink to="/earnings" className={navClass}><CoinsIcon />     Earnings</NavLink>
        </nav>

        {/* Vendor info */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{vendor?.name}</div>
              <div className="text-[10px] text-slate-500 uppercase truncate">{vendor?.carriers?.join(', ')}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-slate-500 hover:text-slate-300 transition-colors p-1">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 bg-slate-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
