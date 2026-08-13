import { useState, useEffect } from 'react';

export default function CountdownTimer({ onZero }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());

    return {
      total: diff,
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTime = getTimeLeft();
      setTimeLeft(nextTime);
      if (nextTime.total === 0 && onZero) {
        onZero();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [onZero]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg">
        {/* Ambient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Next Rotation In
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {/* Hours */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {pad(timeLeft.hours)}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Hours
              </p>
            </div>

            <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 -mt-5">:</span>

            {/* Minutes */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {pad(timeLeft.minutes)}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Minutes
              </p>
            </div>

            <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 -mt-5">:</span>

            {/* Seconds */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {pad(timeLeft.seconds)}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
