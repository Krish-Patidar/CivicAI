import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react';

const Sidebar = ({ links, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open, close on Esc / when resized to desktop
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileOpen]);

  // Shared inner content (desktop sidebar + mobile drawer)
  const renderContent = (isCollapsed, isMobile) => (
    <>
      {/* Logo */}
      <div className="p-5 lg:p-6 border-b border-white/10 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <div className="text-white font-black text-lg tracking-tight">CivicAI</div>
            <div className="text-primary-400 text-xs font-semibold uppercase tracking-wider">{subtitle}</div>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ml-auto w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div className="p-5 lg:p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 border border-white/10">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-white font-bold truncate tracking-wide">{user?.name}</div>
              <div className="text-gray-400 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path ||
            (link.path !== '/' && location.pathname.startsWith(link.path));

          const Icon = link.icon;

          return (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 min-h-[48px] rounded-2xl transition-all duration-300 group ${isActive ? 'bg-gradient-to-r from-primary-600/20 to-transparent text-white border-l-2 border-primary-500 rounded-l-none' : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/5'}`}
              title={isCollapsed ? link.label : ''}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
              </div>
              {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 min-h-[48px] rounded-2xl transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/10 group">
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="font-semibold text-sm">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== Mobile / tablet: top bar ===== */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-16 px-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors flex-shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-white font-black text-base tracking-tight">CivicAI</div>
          <div className="text-primary-400 text-[10px] font-semibold uppercase tracking-wider truncate">{subtitle}</div>
        </div>
        <div className="ml-auto w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border border-white/10 flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
      </header>

      {/* ===== Mobile / tablet: slide-in drawer ===== */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-[100dvh] bg-background transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigation"
      >
        <div className="h-full bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col">
          {renderContent(false, true)}
        </div>
      </aside>

      {/* ===== Desktop sidebar (unchanged look) ===== */}
      <aside className={`hidden lg:flex ${collapsed ? 'w-20' : 'w-72'} min-h-screen bg-white/5 backdrop-blur-3xl border-r border-white/10 flex-col transition-all duration-300 flex-shrink-0 relative z-20`}>
        {renderContent(collapsed, false)}
      </aside>
    </>
  );
};

export default Sidebar;
