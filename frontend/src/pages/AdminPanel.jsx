import { useState, useEffect, useCallback } from 'react';
import AdminLogin from '../components/AdminLogin';
import { useApp } from '../context/AppContext';
import {
  fetchAdminState, setDay, addLeaveDay, removeLeaveDay,
  setAnnouncement, setPause, fetchAllSeating, updateSeating, resetSeating,
  generateRandomSeating, clearRandomSeating,
} from '../utils/api';

const VALID_CODES = ['G1', 'G2', 'G3', 'G4', 'B1', 'B2'];

export default function AdminPanel() {
  const { auth, refetch: refetchGlobalRotation } = useApp();
  const { pin } = auth;
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'set-day', 'pause', 'leave', 'announcement', etc.
  const [toast, setToast] = useState(null);

  // Form state
  const [dayInput, setDayInput] = useState('');
  const [leaveInput, setLeaveInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');

  // Seating editor state
  const [allSeating, setAllSeating] = useState(null);
  const [editDay, setEditDay] = useState(1);
  const [editArrangement, setEditArrangement] = useState(['G1', 'G2', 'G3', 'G4', 'B1', 'B2']);
  const [showEditor, setShowEditor] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [loadError, setLoadError] = useState(null);

  const loadState = useCallback(async () => {
    if (!pin) return;
    setLoadError(null);
    try {
      const data = await fetchAdminState(pin);
      setState(data);
      setDayInput(String(data.currentDay));
      setAnnouncementInput(data.announcement?.text || '');
    } catch (err) {
      console.error('Failed to load state:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        auth.logout();
        showToast('Admin session expired. Please sign in again.', 'error');
      } else {
        setLoadError('Unable to connect to the backend server. Please check your connection.');
        showToast('Failed to load admin state', 'error');
      }
    }
  }, [pin, auth]);

  const loadSeating = useCallback(async () => {
    if (!pin) return;
    try {
      const data = await fetchAllSeating(pin);
      setAllSeating(data.seating);
    } catch (err) {
      console.error('Failed to load seating:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        auth.logout();
      }
    }
  }, [pin, auth]);

  useEffect(() => {
    if (pin) {
      loadState();
      loadSeating();
    }
  }, [pin, loadState, loadSeating]);

  useEffect(() => {
    if (allSeating && allSeating[editDay]) {
      setEditArrangement([...allSeating[editDay].arrangement]);
    }
  }, [editDay, allSeating]);

  if (!pin) {
    return <AdminLogin onLogin={auth.savePin} />;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Connection Error</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{loadError}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              loadState();
              loadSeating();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-md hover:scale-105 transition-all"
          >
            Retry
          </button>
          <button
            onClick={() => auth.logout()}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
          <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Administrator Dashboard...</p>
      </div>
    );
  }

  // Handlers
  async function handleSetDay(e) {
    e.preventDefault();
    const num = parseInt(dayInput, 10);
    if (isNaN(num) || num < 1 || num > 24) {
      showToast('Day must be between 1 and 24', 'error');
      return;
    }
    setLoading(true);
    setActionLoading('set-day');
    try {
      const result = await setDay(pin, num);
      showToast(result.message || `Rotation set to Day ${num}`);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set day', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleAddLeave(e) {
    e.preventDefault();
    if (!leaveInput) return;
    setLoading(true);
    setActionLoading('leave-add');
    try {
      const result = await addLeaveDay(pin, leaveInput);
      showToast(result.message || `Leave added for ${leaveInput}`);
      setLeaveInput('');
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add leave day', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleRemoveLeave(date) {
    setLoading(true);
    setActionLoading(`leave-remove-${date}`);
    try {
      const result = await removeLeaveDay(pin, date);
      showToast(result.message || `Leave removed for ${date}`);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove leave day', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleAnnouncement(active) {
    setLoading(true);
    setActionLoading('announcement');
    try {
      const result = await setAnnouncement(pin, announcementInput, active);
      showToast(result.message || (active ? 'Announcement published' : 'Announcement cleared'));
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update announcement', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handlePause() {
    setLoading(true);
    setActionLoading('pause');
    try {
      const result = await setPause(pin, !state.isPaused);
      showToast(result.message || (state.isPaused ? 'Rotation resumed' : 'Rotation paused'));
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update pause state', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleSaveSeating() {
    const unique = new Set(editArrangement);
    if (unique.size !== 6) {
      showToast('Each seat code must appear exactly once', 'error');
      return;
    }
    for (const code of editArrangement) {
      if (!VALID_CODES.includes(code)) {
        showToast(`Invalid seat code: ${code}`, 'error');
        return;
      }
    }

    setLoading(true);
    setActionLoading('seating-save');
    try {
      const result = await updateSeating(pin, editDay, editArrangement);
      showToast(result.message || `Seating for Day ${editDay} updated`);
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update seating', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleResetSeating() {
    setLoading(true);
    setActionLoading('seating-reset');
    try {
      const result = await resetSeating(pin, editDay);
      showToast(result.message || `Day ${editDay} reset to default`);
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset seating', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleGenerateRandom() {
    setLoading(true);
    setActionLoading('random-gen');
    try {
      const result = await generateRandomSeating(pin);
      showToast(result.message || 'Random seating layout generated');
      await loadState();
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate random seating', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  async function handleClearRandom() {
    setLoading(true);
    setActionLoading('random-clear');
    try {
      const result = await clearRandomSeating(pin);
      showToast(result.message || 'Random layout cleared');
      await loadState();
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to clear random layout', 'error');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-down px-5 py-3 rounded-2xl shadow-xl text-xs font-bold ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-500/25'
            : 'bg-rose-600 text-white shadow-rose-500/25'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control rotation cycle, override days, manage holidays and announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              auth.logout();
              refetchGlobalRotation();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
          >
            Logout Admin
          </button>
        </div>
      </div>

      {/* System Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-xs">
          <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Day {state.currentDay} / 24
          </p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Current Day</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${state.isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className={state.isPaused ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {state.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Rotation Status</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            {state.leaveDays ? state.leaveDays.length : 0}
          </p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Leave Days</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-xs">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            state.announcement?.active
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {state.announcement?.active ? '📢 Live' : 'None'}
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Announcement</p>
        </div>
      </div>

      {/* Control Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── 1. Rotation Day Manager ─────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                📅
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Rotation Day Override</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manually jump to any day in 1–24 cycle</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSetDay} className="p-5 space-y-4">
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                max="24"
                value={dayInput}
                onChange={(e) => setDayInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="1–24"
              />
              <button
                type="submit"
                disabled={loading || actionLoading === 'set-day'}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading === 'set-day' ? 'Setting...' : 'Set Day'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[1, 6, 12, 18, 24].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDayInput(String(d))}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition-all"
                >
                  Day {d}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* ─── 2. Pause / Resume Rotation ────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                state.isPaused ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {state.isPaused ? '⏸️' : '▶️'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pause / Resume Rotation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Freeze seating arrangement until resumed</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current State</p>
                <p className={`text-base font-extrabold mt-0.5 ${state.isPaused ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {state.isPaused ? 'Paused — Auto-rotation frozen' : 'Active — Auto-rotation running'}
                </p>
              </div>
              <button
                onClick={handlePause}
                disabled={loading || actionLoading === 'pause'}
                className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  state.isPaused
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20'
                }`}
              >
                {actionLoading === 'pause' ? 'Updating...' : state.isPaused ? '▶ Resume Rotation' : '⏸ Pause Rotation'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. Leave Days Manager ────────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md">
                🏖️
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Leave Days & Holidays</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure dates to skip (Weekends auto-skipped)</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <form onSubmit={handleAddLeave} className="flex gap-3">
              <input
                type="date"
                value={leaveInput}
                onChange={(e) => setLeaveInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !leaveInput || actionLoading === 'leave-add'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading === 'leave-add' ? 'Adding...' : 'Add Leave'}
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Configured Leave Days</p>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                {!state.leaveDays || state.leaveDays.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No leave days configured</p>
                ) : (
                  state.leaveDays.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold"
                    >
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <button
                        onClick={() => handleRemoveLeave(date)}
                        disabled={loading}
                        className="hover:text-rose-800 dark:hover:text-rose-200 transition-colors font-black"
                        title="Delete leave day"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. Announcements Manager ──────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
                📢
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Announcement</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Post prominent notices on student dashboard</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <textarea
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="e.g., Tomorrow's class will be conducted in Room 204."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleAnnouncement(true)}
                disabled={loading || !announcementInput.trim() || actionLoading === 'announcement'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading === 'announcement' ? 'Saving...' : state.announcement?.active ? 'Update Announcement' : 'Publish Announcement'}
              </button>

              {state.announcement?.active && (
                <button
                  onClick={() => handleAnnouncement(false)}
                  disabled={loading || actionLoading === 'announcement'}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {state.announcement?.active ? (
              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <span className="font-bold">Active Notice:</span> "{state.announcement.text}"
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No current announcements active</p>
            )}
          </div>
        </div>

      </div>

      {/* ─── 5. Custom Seating Editor & Random Generator ──── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
              🛠️
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Custom Seating Editor & Generator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Override row arrangements or generate random layouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateRandom}
              disabled={loading || actionLoading === 'random-gen'}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all"
            >
              🎲 Generate Random
            </button>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all"
            >
              {showEditor ? 'Hide Custom Editor' : 'Open Custom Editor'}
            </button>
          </div>
        </div>

        {showEditor && (
          <div className="p-5 space-y-6 animate-fade-in">
            {/* Day Selector Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Select Rotation Day to Customize (1–24)
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => {
                  const isCustom = allSeating?.[d]?.isCustom;
                  return (
                    <button
                      key={d}
                      onClick={() => setEditDay(d)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all hover:scale-105 ${
                        editDay === d
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                          : isCustom
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row Selectors */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Day {editDay} Seating (Row 1 → Row 6)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {editArrangement.map((code, idx) => (
                  <div key={idx}>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">Row {idx + 1}</label>
                    <select
                      value={code}
                      onChange={(e) => {
                        const updated = [...editArrangement];
                        updated[idx] = e.target.value;
                        setEditArrangement(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      {VALID_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Save / Reset Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveSeating}
                disabled={loading || actionLoading === 'seating-save'}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading === 'seating-save' ? 'Saving...' : '💾 Save Custom Seating'}
              </button>
              <button
                onClick={handleResetSeating}
                disabled={loading || actionLoading === 'seating-reset'}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {actionLoading === 'seating-reset' ? 'Resetting...' : '🔄 Reset Day to Default'}
              </button>
              <button
                onClick={handleClearRandom}
                disabled={loading || actionLoading === 'random-clear'}
                className="px-6 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 disabled:opacity-50 transition-all"
              >
                Clear Random Layout
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
