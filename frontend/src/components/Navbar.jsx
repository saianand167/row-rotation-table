import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTodo } from '../context/TodoContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    refetch,
    auth,
    notificationsEnabled,
    enableNotifications,
    toggleNotificationDrawer,
    unreadNotificationsCount,
    rotationData,
  } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated: isTodoAuth, user: todoUser } = useTodo();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const hasActiveAnnouncement = !!(rotationData?.announcement?.active && rotationData?.announcement?.text);
  const badgeCount = unreadNotificationsCount + (hasActiveAnnouncement ? 1 : 0);

  // Secret feature: Double click on logo launches critical admin if configured
  const handleLogoClick = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      e.preventDefault();
      navigate('/critical-admin');
    } else {
      lastTapRef.current = now;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setLoginLoading(true);
    setLoginError('');
    const result = await auth.login(pinInput);
    setLoginLoading(false);
    if (result.success) {
      setPinInput('');
      setShowLoginModal(false);
      refetch();
      navigate('/admin');
    } else {
      setLoginError(result.error || 'Incorrect PIN. Please try again.');
    }
  };

  const isTodoActive = location.pathname.startsWith('/todo');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Brand Logo */}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-3 group focus:outline-none"
              aria-label="Row Rotation Table Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-300">
                <span className="text-white text-lg font-black tracking-wider">R</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  CSE-5
                </span>
                <span className="text-xs block font-bold text-slate-600 dark:text-slate-300 tracking-wider">
                  Row Rotation
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  location.pathname === '/'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Class View
              </Link>

              {/* To-Do & Tasks Link */}
              <Link
                to={isTodoAuth ? "/todo/dashboard" : "/todo"}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  isTodoActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>To-Do & Tasks</span>
                {isTodoAuth && todoUser && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </Link>

              <Link
                to="/admin"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  location.pathname === '/admin'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
            </div>

            {/* Right Controls: Notification Bell, Dark Mode Toggle & Admin Auth Action */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Notification Bell Button (Activates & Tests Device Push Notifications) */}
              <button
                onClick={async () => {
                  const granted = await enableNotifications();
                  if (granted || notificationsEnabled) {
                    try {
                      // Trigger direct test push to device notification bar
                      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                      await fetch(`${API_BASE}/notifications/test-push`, { method: 'POST' });
                    } catch (e) {
                      console.error('Test push error:', e);
                    }
                  }
                }}
                className={`p-2 rounded-xl transition-all relative ${
                  notificationsEnabled
                    ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                } hover:scale-105 active:scale-95`}
                title={notificationsEnabled ? 'Click to Test Device Push Notification 🔔' : 'Click to Enable Device Notifications 🔔'}
                aria-label="Toggle Device Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationsEnabled && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                {notificationsEnabled && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Dark/Light Mode Switch */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {!auth.isLoggedIn ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-xs"
                >
                  Admin Login
                </button>
              ) : (
                <button
                  onClick={() => {
                    auth.logout();
                    refetch();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                >
                  Logout Admin
                </button>
              )}
            </div>

            {/* Mobile Menu & Theme Buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={toggleNotificationDrawer}
                className="p-2 rounded-xl transition-all relative text-slate-600 dark:text-slate-300"
                title="Announcements"
                aria-label="Announcements"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {badgeCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
                {badgeCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 space-y-1 border-t border-slate-200/80 dark:border-slate-800/80 pt-2 animate-slide-down">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              <Link
                to={isTodoAuth ? '/todo/dashboard' : '/todo'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isTodoActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  To-Do & Tasks
                </div>
                {isTodoAuth && todoUser?.username && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[100px]">
                    {todoUser.username}
                  </span>
                )}
              </Link>

              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </Link>

              {!auth.isLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLoginModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Admin Sign In
                </button>
              ) : (
                <button
                  onClick={() => {
                    auth.logout();
                    setMobileMenuOpen(false);
                    refetch();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  Logout Admin
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Admin Login Quick Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full animate-scale-in">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError('');
                setPinInput('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center mt-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Sign In</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your Admin PIN to manage seating and settings.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-rose-500 text-center font-medium">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading || !pinInput.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
