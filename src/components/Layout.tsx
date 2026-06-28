import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const JobsIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const EarningsIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const KeyIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BatchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const Layout: React.FC = () => {
  const { vendor, logout }           = useAuth();
  const { newJobCount, clearNewJobCount } = useSocket();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = [
    { name: 'My Jobs',          href: '/jobs',            icon: JobsIcon,    badge: newJobCount, onActivate: clearNewJobCount },
    { name: 'Earnings',         href: '/earnings',        icon: EarningsIcon, badge: 0 },
    { name: 'Change Password',  href: '/change-password', icon: KeyIcon,      badge: 0 },
  ];

  const isActive = (href: string) =>
    href === '/jobs'
      ? location.pathname === '/jobs' || location.pathname.startsWith('/jobs/')
      : location.pathname === href;

  const NavLinks = () => (
    <>
      {nav.map(item => (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => { item.onActivate?.(); setOpen(false); }}
          className={`flex items-center justify-between px-4 py-2.5 rounded-lg mx-2 text-sm font-medium transition-all ${
            isActive(item.href)
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <item.icon />
            {item.name}
          </span>
          {item.badge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </Link>
      ))}
    </>
  );

  const initials = vendor?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-slate-900 flex-col fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <BatchIcon />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">BatchOps</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Vendor Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Vendor info */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{vendor?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{vendor?.carriers?.join(', ')}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-slate-500 hover:text-red-400 transition p-1">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <BatchIcon />
          </div>
          <span className="text-sm font-bold text-white">BatchOps</span>
          {newJobCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {newJobCount}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-white transition">
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-14 bottom-0 w-56 bg-slate-900 flex flex-col" onClick={e => e.stopPropagation()}>
            <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="border-t border-slate-800 p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{vendor?.name}</div>
                  <div className="text-[10px] text-slate-500">{vendor?.carriers?.join(', ')}</div>
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition p-1">
                  <LogoutIcon />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
