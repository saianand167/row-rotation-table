import { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/3 dark:to-teal-500/3" />

        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Next Rotation In
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Hours */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {pad(timeLeft.hours)}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hours
              </p>
            </div>

            <span className="text-2xl font-bold text-gray-400 dark:text-gray-600 mt-[-20px]">:</span>

            {/* Minutes */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {pad(timeLeft.minutes)}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Minutes
              </p>
            </div>

            <span className="text-2xl font-bold text-gray-400 dark:text-gray-600 mt-[-20px]">:</span>

            {/* Seconds */}
            <div className="text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {pad(timeLeft.seconds)}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
