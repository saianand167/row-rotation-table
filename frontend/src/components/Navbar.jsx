import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTodo } from '../context/TodoContext';
import DownloadAppModal from './DownloadAppModal';

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
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const hasActiveAnnouncement = !!(rotationData?.announcement?.active && rotationData?.announcement?.text);
  const badgeCount = unreadNotificationsCount + (hasActiveAnnouncement ? 1 : 0);

  // Secret feature: Double click on logo launches critical admin
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

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const aiTools = [
    { name: 'Document & RAG AI', path: '/rag', icon: '📄', desc: 'Permanent Knowledge Base' },
    { name: 'Vision & Image AI', path: '/vision-ai', icon: '🖼️', desc: 'Multimodal image Q&A' },
    { name: 'CSV Data Analytics', path: '/data-analytics', icon: '📊', desc: 'Dataset stats & charts' },
    { name: 'SQL Database AI', path: '/database-ai', icon: '🗄️', desc: 'Safe read-only SQL studio' },
    { name: 'Voice & Audio AI', path: '/voice-ai', icon: '🎙️', desc: 'En / Hi / Te STT & speech' },
    { name: 'YouTube & Video AI', path: '/video-ai', icon: '🎥', desc: 'Summaries & study quizzes' },
    { name: 'ORCA Marine AI', path: '/orca', icon: '🌊', desc: 'ISRO marine safety engine' },
    { name: 'Healthcare & MediKiosk', path: '/healthcare', icon: '🏥', desc: 'Clinical intake & triage' },
    { name: 'Tasks & Progress', path: isTodoAuth ? '/todo/dashboard' : '/todo', icon: '✅', desc: 'Student assignments' },
  ];

  const isCurrentActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-300">
        <div className="w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-18">

            {/* Brand Logo */}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-3.5 group focus:outline-none"
              aria-label="CSE-5 Generative AI Super App Home"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
                <span className="text-white text-xl font-black tracking-wider">R</span>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  CSE-5
                </span>
                <span className="text-xs block font-bold text-slate-500 dark:text-slate-400 tracking-wider -mt-0.5">
                  AI Super App
                </span>
              </div>
            </Link>

            {/* Desktop Primary Navigation (Clean 4 Core Tabs + Tools Dropdown) */}
            <div className="hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
              {/* 1. Dashboard */}
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isCurrentActive('/')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🏠</span> Dashboard
              </Link>

              {/* 2. AI Assistant */}
              <Link
                to="/ai-chat"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isCurrentActive('/ai-chat')
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🤖</span> AI Assistant
              </Link>

              {/* 3. Row Rotation */}
              <Link
                to="/class-view"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isCurrentActive('/class-view')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🪑</span> Row Rotation
              </Link>

              {/* 4. Tasks & To-Do */}
              <Link
                to={isTodoAuth ? '/todo/dashboard' : '/todo'}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  location.pathname.startsWith('/todo')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✅</span> To-Do
              </Link>

              {/* Tools Studio Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setToolsDropdownOpen(prev => !prev)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    location.pathname !== '/' && location.pathname !== '/ai-chat' && location.pathname !== '/class-view' && !location.pathname.startsWith('/todo') && location.pathname !== '/admin'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚡</span> AI Studios
                  <svg className={`w-4 h-4 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {toolsDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 w-80 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1 z-50 animate-scale-in">
                    {aiTools.map((tool, idx) => (
                      <Link
                        key={idx}
                        to={tool.path}
                        onClick={() => setToolsDropdownOpen(false)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                          isCurrentActive(tool.path)
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                          <div className="text-sm font-bold">{tool.name}</div>
                          <div className="text-xs text-slate-400">{tool.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Admin */}
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isCurrentActive('/admin')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⚙️</span> Admin
              </Link>
            </div>

            {/* Right Utility Controls: Notification, Theme, Auth, Download App */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Download App Button */}
              <button
                onClick={() => setShowDownloadModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                title="Download & Install App on Phone or Laptop"
              >
                <span>📱</span>
                <span>Download App</span>
              </button>

              {/* Notification Push Button */}
              <button
                onClick={async () => {
                  const granted = await enableNotifications();
                  if (granted || notificationsEnabled) {
                    try {
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
                title={notificationsEnabled ? 'Device Push Active 🔔' : 'Enable Device Notifications 🔔'}
                aria-label="Toggle Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {badgeCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                {badgeCount > 0 && (
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

              {/* Admin Auth Pill */}
              {!auth.isLoggedIn ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  Admin PIN
                </button>
              ) : (
                <button
                  onClick={() => {
                    auth.logout();
                    refetch();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Logout Admin
                </button>
              )}
            </div>

            {/* Mobile Header Controls */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setShowDownloadModal(true)}
                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-bold text-sm"
                title="Download App"
              >
                📱
              </button>

              <button
                onClick={toggleNotificationDrawer}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300"
                aria-label="Announcements"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300"
                aria-label="Toggle Theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle Menu"
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

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 space-y-1.5 border-t border-slate-200/80 dark:border-slate-800/80 pt-3 animate-slide-down">
              {/* Install App Quick Action in Mobile Drawer */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowDownloadModal(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer shadow-xs mb-2"
              >
                <span className="flex items-center gap-2"><span>📱</span> Install / Download App</span>
                <span>📥</span>
              </button>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  isCurrentActive('/')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>🏠</span> Dashboard
              </Link>

              <Link
                to="/ai-chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  isCurrentActive('/ai-chat')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>🤖</span> AI Assistant
              </Link>

              <Link
                to="/class-view"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  isCurrentActive('/class-view')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>🪑</span> Row Rotation
              </Link>

              <Link
                to={isTodoAuth ? '/todo/dashboard' : '/todo'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  location.pathname.startsWith('/todo')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>✅</span> Tasks & To-Do
              </Link>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  AI Studios & Tools
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-2">
                  {aiTools.map((t, idx) => (
                    <Link
                      key={idx}
                      to={t.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span>{t.icon}</span>
                      <span className="truncate">{t.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  <span>⚙️</span> Admin Console
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
