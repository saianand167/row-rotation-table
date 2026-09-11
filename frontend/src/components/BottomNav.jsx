import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTodo } from '../context/TodoContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import DownloadAppModal from './DownloadAppModal';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated: isTodoAuth } = useTodo();
  const { isDark, toggleTheme } = useTheme();
  const { auth, notificationsEnabled, enableNotifications, unreadNotificationsCount } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'AI Chat', path: '/ai-chat', icon: '🤖', badge: 'AI' },
    { label: 'Rotation', path: '/class-view', icon: '🪑' },
    { label: 'Tasks', path: isTodoAuth ? '/todo/dashboard' : '/todo', icon: '✅' },
  ];

  const studios = [
    { name: 'Document & RAG', path: '/rag', icon: '📄', desc: 'Permanent Knowledge Base' },
    { name: 'Vision & Image AI', path: '/vision-ai', icon: '🖼️', desc: 'Multimodal Vision Q&A' },
    { name: 'CSV Analytics', path: '/data-analytics', icon: '📊', desc: 'Dataset Profiling & Charts' },
    { name: 'SQL Database AI', path: '/database-ai', icon: '🗄️', desc: 'Safe Read-Only Studio' },
    { name: 'Voice & Audio AI', path: '/voice-ai', icon: '🎙️', desc: 'Speech to Text & TTS' },
    { name: 'YouTube Video AI', path: '/video-ai', icon: '🎥', desc: 'Lecture Summarizer' },
    { name: 'ORCA Marine AI', path: '/orca', icon: '🌊', desc: 'ISRO Ocean Telemetry' },
    { name: 'Healthcare Kiosk', path: '/healthcare', icon: '🏥', desc: 'Triage & Consultation' },
    { name: 'Admin Console', path: '/admin', icon: '⚙️', desc: 'Classroom & Seating Controls' },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar - strictly visible only on mobile/tablet (hidden on lg/desktop >= 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[11px] mt-1 tracking-tight truncate">{item.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* More Studios & Tools Button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
              moreOpen || (!navItems.some(i => isActive(i.path)) && location.pathname !== '/')
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl leading-none">⚡</span>
            <span className="text-[11px] mt-1 tracking-tight">More</span>
            {moreOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* "More" Bottom Sheet Drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto safe-bottom animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">AI Studios & Tools</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">All specialized intelligence workflows</p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Install Action inside Mobile Sheet */}
            <button
              onClick={() => {
                setMoreOpen(false);
                setDownloadModalOpen(true);
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📱</span>
                <span>Install CSE-5 App on Phone</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">1-Click</span>
            </button>

            {/* Studio Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {studios.map((s, idx) => (
                <Link
                  key={idx}
                  to={s.path}
                  onClick={() => setMoreOpen(false)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    location.pathname === s.path
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl mb-1">{s.icon}</span>
                  <div>
                    <div className="font-bold text-xs leading-tight">{s.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{s.desc}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom Quick Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
              </button>

              <button
                onClick={async () => {
                  await enableNotifications();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                <span>🔔 {notificationsEnabled ? 'Alerts On' : 'Enable Alerts'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </>
  );
}
