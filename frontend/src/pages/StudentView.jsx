import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchNavigate } from '../utils/api';
import SeatingCard from '../components/SeatingCard';
import CountdownTimer from '../components/CountdownTimer';
import AnnouncementBanner from '../components/AnnouncementBanner';

const NAV_BUTTONS = [
  { offset: -1, label: 'Yesterday', icon: '◀' },
  { offset: 0, label: 'Today', icon: '📅' },
  { offset: 1, label: 'Tomorrow', icon: '▶' },
  { offset: 2, label: 'Day After', icon: '⏭' },
];

export default function StudentView() {
  const { rotationData: data, loading, error } = useApp();
  const [activeOffset, setActiveOffset] = useState(0);
  const [navData, setNavData] = useState(null);
  const [navLoading, setNavLoading] = useState(false);

  const loadNavDay = useCallback(async (offset) => {
    setActiveOffset(offset);
    if (offset === 0) {
      setNavData(null); // Use main data for today
      return;
    }
    setNavLoading(true);
    try {
      const result = await fetchNavigate(offset);
      setNavData(result);
    } catch (err) {
      console.error('Navigation error:', err);
      setNavData(null);
    } finally {
      setNavLoading(false);
    }
  }, []);

  // Reset to today when main data refreshes
  useEffect(() => {
    if (data && activeOffset === 0) {
      setNavData(null);
    }
  }, [data, activeOffset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading rotation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connection Error</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Make sure the backend server is running on port 5000</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Determine display data based on active navigation
  const displayData = activeOffset === 0 ? data : navData;
  const isHoliday = displayData?.isHoliday;
  const displayDay = isHoliday ? null : (activeOffset === 0 ? data.currentDay : navData?.rotationDay);
  const displayDate = activeOffset === 0 ? data.date : navData?.date;
  const displaySeating = isHoliday ? null : (activeOffset === 0 ? data.seating : navData?.seating);

  const formattedDate = displayDate ? new Date(displayDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Announcement banner */}
      {data.announcement && activeOffset === 0 && (
        <AnnouncementBanner text={data.announcement.text} />
      )}

      {/* Paused indicator */}
      {data.isPaused && activeOffset === 0 && (
        <div className="animate-fade-in rounded-2xl border border-orange-500/20 dark:border-orange-500/10 bg-orange-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Auto-rotation is paused by admin
            </p>
          </div>
        </div>
      )}

      {/* ─── Day Navigation Controls ───────────────────── */}
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {NAV_BUTTONS.map((btn) => (
            <button
              key={btn.offset}
              onClick={() => loadNavDay(btn.offset)}
              disabled={navLoading}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.97] ${
                activeOffset === btn.offset
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/20'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero: Current Day */}
      <div className="text-center animate-fade-in">
        {activeOffset === 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Live Rotation
            </span>
          </div>
        )}

        {activeOffset !== 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/5 border border-sky-500/20 dark:border-sky-500/10 mb-4">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              {activeOffset < 0 ? 'Past View' : 'Future Preview'}
            </span>
          </div>
        )}

        {navLoading ? (
          <div className="py-8">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        ) : isHoliday ? (
          <>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                🎉 Holiday
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">
              {formattedDate}
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 mt-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10">
              <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">
                {displayData?.reason === 'Friday' ? '☀️ Friday — Holiday' :
                 displayData?.reason === 'Saturday' ? '☀️ Saturday — Holiday' :
                 displayData?.reason === 'Sunday' ? '☀️ Sunday — Holiday' :
                 '📋 Leave Day — No class'}
              </span>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-3">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                {displayDay === 'Random' ? 'Random' : `Day ${displayDay}`}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              {formattedDate}
            </p>
          </>
        )}
      </div>

      {/* Seating Arrangement */}
      {!isHoliday && displaySeating && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeOffset === 0 ? "Today's Seating" : 'Seating Arrangement'}
              </h2>
            </div>
            {displayData?.isHolidayRandom ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                🎲 Today's Random is Displayed
              </span>
            ) : displayData?.isRandomLayout ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider animate-pulse shadow-sm">
                🎲 Random Layout
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySeating.map((seat, index) => (
              <SeatingCard
                key={`${activeOffset}-${seat.row}`}
                row={seat.row}
                code={seat.code}
                type={seat.type}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {!isHoliday && displaySeating && (
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Girls (G1–G4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Boys (B1–B2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Sundays skipped</span>
          </div>
        </div>
      )}

      {/* Countdown Timer (only for today view) */}
      {activeOffset === 0 && !isHoliday && <CountdownTimer />}

      {/* Footer */}
      <footer className="text-center pt-6 pb-8 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="border-t border-gray-200/30 dark:border-white/5 pt-6">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
            24-day rotation cycle • Weekends (Fri-Sun) skipped • {data.currentDay === 'Random' ? 'Holiday Random Layout' : `Day ${data.currentDay} of 24`}
          </p>
          <p className="text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Made with ❤️ for CSE5
          </p>
        </div>
      </footer>
    </div>
  );
}
