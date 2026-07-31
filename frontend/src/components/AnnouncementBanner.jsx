import { useState, useEffect } from 'react';

export default function AnnouncementBanner({ text }) {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setVisible(true);
    setDismissed(false);
  }, [text]);

  if (!text || dismissed) return null;

  return (
    <div
      className={`animate-slide-down relative overflow-hidden rounded-2xl border border-amber-500/20 dark:border-amber-500/10 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-500/5 dark:via-orange-500/5 dark:to-amber-500/5 backdrop-blur-sm transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Pulse dot */}
      <div className="absolute top-4 left-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      </div>

      <div className="p-4 pl-10 pr-12">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              📢 Announcement
            </p>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {text}
            </p>
          </div>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors"
        aria-label="Dismiss announcement"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
