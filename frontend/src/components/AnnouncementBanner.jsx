import { useState, useEffect } from 'react';

export default function AnnouncementBanner({ text }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [text]);

  if (!text || !text.trim() || dismissed) return null;

  return (
    <div className="animate-slide-down relative overflow-hidden rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 dark:from-amber-500/10 dark:to-amber-500/5 backdrop-blur-sm p-4 pl-11 pr-12 shadow-sm">
      {/* Pulse dot */}
      <div className="absolute top-4 left-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
            📢 Announcement
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-amber-100 leading-snug">
            "{text}"
          </p>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors"
        aria-label="Dismiss announcement"
        title="Dismiss announcement"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
