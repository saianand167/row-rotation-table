import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTodo } from '../context/TodoContext';
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
  const { rotationData: data, loading, error, refetch } = useApp();
  const { isAuthenticated: isTodoAuth, user: todoUser } = useTodo();
  const [activeOffset, setActiveOffset] = useState(0);
  const [navData, setNavData] = useState(null);
  const [navLoading, setNavLoading] = useState(false);

  const loadNavDay = useCallback(async (offset) => {
    setActiveOffset(offset);
    if (offset === 0) {
      setNavData(null);
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

  useEffect(() => {
    if (data && activeOffset === 0) {
      setNavData(null);
    }
  }, [data, activeOffset]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Loading today's seating...</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fetching latest row rotation table</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Connection Error</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

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

  const dayNumber = typeof displayDay === 'number' ? displayDay : null;
  const isPaused = data.isPaused && activeOffset === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">

      {/* Top Main Title Header */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          RRT — Row Rotation Table
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Real-Time Classroom Seating Rotation
        </p>
      </div>

      {/* Announcement Banner (if active) */}
      {data.announcement && activeOffset === 0 && (
        <AnnouncementBanner text={data.announcement.text} />
      )}

      {/* Paused Rotation Indicator */}
      {isPaused && (
        <div className="animate-fade-in rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Rotation Paused</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                The current seating arrangement will remain active until the administrator resumes the rotation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Day Navigation Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {NAV_BUTTONS.map((btn) => (
          <button
            key={btn.offset}
            onClick={() => loadNavDay(btn.offset)}
            disabled={navLoading}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              activeOffset === btn.offset
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Hero Display: Today's Rotation Day */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-4">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />

        {activeOffset === 0 ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider">Live Classroom Rotation</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 text-sky-600 dark:text-sky-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeOffset < 0 ? 'Past Arrangement' : 'Future Arrangement'}
            </span>
          </div>
        )}

        {navLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : isHoliday ? (
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              🎉 Holiday / Non-Class Day
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{formattedDate}</p>
            <div className="inline-block mt-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
              {displayData?.reason === 'Friday' ? '☀️ Friday Holiday' :
               displayData?.reason === 'Saturday' ? '☀️ Saturday Holiday' :
               displayData?.reason === 'Sunday' ? '☀️ Sunday Holiday' :
               '📋 Leave Day Configured'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500">
              Rotation Day
            </p>
            <h2 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
              {displayDay === 'Random' ? 'Random Day' : `Day ${displayDay} / 24`}
            </h2>

            {/* Cycle progress bar */}
            {dayNumber && (
              <div className="max-w-md mx-auto pt-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(dayNumber / 24) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 px-1">
                  <span>Day 1</span>
                  <span>Cycle Progress</span>
                  <span>Day 24</span>
                </div>
              </div>
            )}

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium pt-1">
              {formattedDate}
            </p>
          </div>
        )}
      </div>

      {/* Today's Seating Section */}
      {!isHoliday && displaySeating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                🪑
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeOffset === 0 ? "Today's Seating Arrangement" : 'Seating Arrangement'}
              </h3>
            </div>
            {displayData?.isRandomLayout && (
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
                🎲 Random Layout
              </span>
            )}
          </div>

          {/* Cards Grid */}
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

      {/* Empty Seating State Fallback */}
      {!isHoliday && !displaySeating && (
        <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 font-medium">Seating information is currently unavailable.</p>
        </div>
      )}

      {/* Seating Legend */}
      {!isHoliday && displaySeating && (
        <div className="flex flex-wrap items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Girls (G1–G4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Boys (B1–B2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Weekends skipped</span>
          </div>
        </div>
      )}

      {/* Personal Tasks & To-Do Quick Access Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/5 dark:via-teal-500/5 dark:to-cyan-500/5 border border-emerald-500/20 dark:border-emerald-500/15 p-5 sm:p-6 shadow-md transition-all hover:shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Student To-Do & Task Planner
                </h4>
                {isTodoAuth && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Logged in as {todoUser?.username}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Organize your study goals, daily tasks, and weekly schedules alongside seating rotation.
              </p>
            </div>
          </div>
          <Link
            to={isTodoAuth ? '/todo/dashboard' : '/todo'}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold text-center shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span>{isTodoAuth ? 'Open My Tasks' : 'Access To-Do List'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-6 pb-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          24-day seating rotation cycle • Automatic daily rotation • Weekend skip
        </p>
        <p className="text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-1">
          Row Rotation Table — Classroom Seating System
        </p>
      </footer>

    </div>
  );
}
