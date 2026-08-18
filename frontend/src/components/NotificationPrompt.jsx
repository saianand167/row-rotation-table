import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function NotificationPrompt() {
  const { enableNotifications } = useApp();
  const [showPrompt, setShowPrompt] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    // Only check in browser environments with notification support
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const alreadyPrompted = localStorage.getItem('rrt_notification_prompt_answered');
    const permission = Notification.permission;

    // Show prompt if user hasn't answered yet and permission is 'default' (not yet granted or denied)
    if (!alreadyPrompted && permission === 'default') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1200); // Friendly delay so page renders first
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    setEnabling(true);
    try {
      localStorage.setItem('rrt_notification_prompt_answered', 'true');
      localStorage.setItem('rrt_announcements_accepted', 'true');
      await enableNotifications();
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      setEnabling(false);
      setShowPrompt(false);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('rrt_notification_prompt_answered', 'true');
    localStorage.setItem('rrt_announcements_accepted', 'false');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 animate-scale-in">
        
        {/* Glow accent */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 blur-2xl opacity-30 pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0 animate-bounce">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Enable Announcements?
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Instant Alerts
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Would you like to receive classroom announcements, seating rotation updates, and holiday notices directly in your phone or desktop notification bar?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDecline}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Maybe Later
          </button>
          
          <button
            onClick={handleAccept}
            disabled={enabling}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {enabling ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enabling...
              </>
            ) : (
              <>
                Allow Announcements 🔔
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
