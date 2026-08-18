import { useApp } from '../context/AppContext';

export default function NotificationDrawer() {
  const {
    isNotificationDrawerOpen,
    closeNotificationDrawer,
    notificationsHistory,
    markNotificationsAsRead,
    clearNotificationsHistory,
    notificationsEnabled,
    enableNotifications,
    rotationData,
  } = useApp();

  if (!isNotificationDrawerOpen) return null;

  const currentAnnouncement = rotationData?.announcement?.active && rotationData?.announcement?.text
    ? rotationData.announcement
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={closeNotificationDrawer}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <span className="text-lg">📢</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Announcements & Alerts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Classroom updates & live notifications</p>
              </div>
            </div>

            <button
              onClick={closeNotificationDrawer}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* System Push Status Indicator */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${notificationsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {notificationsEnabled ? 'System Notifications: Active' : 'System Notifications: In-App Mode'}
              </span>
            </div>
            {!notificationsEnabled && (
              <button
                onClick={enableNotifications}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Enable Push Alerts
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Active Class Announcement (Always pinned to top if active) */}
            {currentAnnouncement && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/10 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Live Announcement
                  </span>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium">
                    {new Date(currentAnnouncement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-amber-100 leading-relaxed">
                  "{currentAnnouncement.text}"
                </p>
              </div>
            )}

            {/* Notifications History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Recent Alerts
                </h3>
                {notificationsHistory.length > 0 && (
                  <button
                    onClick={clearNotificationsHistory}
                    className="text-[11px] font-semibold text-slate-600 hover:text-rose-500 dark:text-slate-300 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {notificationsHistory.length === 0 && !currentAnnouncement ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl">
                    📭
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No New Announcements</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                    All classroom announcements, seating rotation changes, and holiday updates will automatically appear right here!
                  </p>
                </div>
              ) : (
                notificationsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.msg}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Auto-syncs via WebSockets
            </span>
            <button
              onClick={() => {
                markNotificationsAsRead();
                closeNotificationDrawer();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
