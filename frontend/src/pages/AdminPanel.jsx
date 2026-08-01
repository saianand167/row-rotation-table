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

  const loadState = useCallback(async () => {
    if (!pin) return;
    try {
      const data = await fetchAdminState(pin);
      setState(data);
      setDayInput(String(data.currentDay));
      setAnnouncementInput(data.announcement?.text || '');
    } catch (err) {
      console.error('Failed to load state:', err);
    }
  }, [pin]);

  const loadSeating = useCallback(async () => {
    if (!pin) return;
    try {
      const data = await fetchAllSeating(pin);
      setAllSeating(data.seating);
    } catch (err) {
      console.error('Failed to load seating:', err);
    }
  }, [pin]);

  useEffect(() => {
    if (pin) {
      loadState();
      loadSeating();
    }
  }, [pin, loadState, loadSeating]);

  // When editDay changes, update the editor arrangement
  useEffect(() => {
    if (allSeating && allSeating[editDay]) {
      setEditArrangement([...allSeating[editDay].arrangement]);
    }
  }, [editDay, allSeating]);

  if (!pin) {
    return <AdminLogin onLogin={auth.savePin} />;
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────

  async function handleSetDay(e) {
    e.preventDefault();
    const num = parseInt(dayInput, 10);
    if (isNaN(num) || num < 1 || num > 24) {
      showToast('Day must be between 1 and 24', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await setDay(pin, num);
      showToast(result.message);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set day', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLeave(e) {
    e.preventDefault();
    if (!leaveInput) return;
    setLoading(true);
    try {
      const result = await addLeaveDay(pin, leaveInput);
      showToast(result.message);
      setLeaveInput('');
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add leave', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveLeave(date) {
    setLoading(true);
    try {
      const result = await removeLeaveDay(pin, date);
      showToast(result.message);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove leave', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnnouncement(active) {
    setLoading(true);
    try {
      const result = await setAnnouncement(pin, announcementInput, active);
      showToast(result.message);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update announcement', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    setLoading(true);
    try {
      const result = await setPause(pin, !state.isPaused);
      showToast(result.message);
      await loadState();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update pause state', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSeating() {
    // Validate
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
    try {
      const result = await updateSeating(pin, editDay, editArrangement);
      showToast(result.message);
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update seating', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSeating() {
    setLoading(true);
    try {
      const result = await resetSeating(pin, editDay);
      showToast(result.message);
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset seating', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateRandom() {
    setLoading(true);
    try {
      const result = await generateRandomSeating(pin);
      showToast(result.message);
      await loadState();
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate random seating', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearRandom() {
    setLoading(true);
    try {
      const result = await clearRandomSeating(pin);
      showToast(result.message);
      await loadState();
      await loadSeating();
      refetchGlobalRotation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to clear random seating', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestPush() {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/notifications/test-push`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Test push notification sent!');
    } catch (err) {
      showToast('Failed to send test push', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDirectNotification() {
    // This tests if Chrome/Windows can show notifications at all (bypasses push pipeline)
    const permission = Notification.permission;
    if (permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        showToast('Notification permission denied by browser', 'error');
        return;
      }
    } else if (permission === 'denied') {
      showToast('Notifications are BLOCKED in your browser. Click the lock icon in the URL bar → set Notifications to Allow', 'error');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification('CSE5 RRT Direct Test ✅', {
          body: 'This notification was triggered directly from your browser! If you see this, notifications WORK.',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [100, 50, 100],
        });
        showToast('Direct notification sent via Service Worker!');
      } else {
        // Fallback: use Notification API directly
        new Notification('CSE5 RRT Direct Test ✅', {
          body: 'This notification was triggered directly! If you see this, notifications WORK.',
          icon: '/favicon.svg',
        });
        showToast('Direct notification sent (no service worker)!');
      }
    } catch (err) {
      showToast('Direct notification failed: ' + err.message, 'error');
    }
  }

  async function handleDiagnostics() {
    const lines = [];
    lines.push('🔍 Push Notification Diagnostics:');
    lines.push('---');
    lines.push(`Browser: ${navigator.userAgent.substring(0, 60)}...`);
    lines.push(`ServiceWorker support: ${'serviceWorker' in navigator}`);
    lines.push(`PushManager support: ${'PushManager' in window}`);
    lines.push(`Notification support: ${'Notification' in window}`);
    lines.push(`Notification.permission: ${Notification.permission}`);

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        lines.push(`SW state: ${reg.active ? 'active' : 'not active'}`);
        lines.push(`SW scope: ${reg.scope}`);
        const sub = await reg.pushManager.getSubscription();
        lines.push(`Push subscription: ${sub ? 'EXISTS' : 'NONE'}`);
        if (sub) {
          lines.push(`Endpoint: ${sub.endpoint.substring(0, 80)}...`);
        }
      } else {
        lines.push('SW: NO SERVICE WORKER REGISTERED');
      }
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${API_BASE}/notifications/count`);
      const data = await res.json();
      lines.push(`Server subscribers: ${data.count}`);
    } catch (e) {
      lines.push(`Server check failed: ${e.message}`);
    }

    const report = lines.join('\n');
    console.log(report);
    alert(report);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-down px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-white shadow-emerald-500/25'
            : 'bg-red-500 text-white shadow-red-500/25'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage rotation settings, seating, and announcements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestPush}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              title="Test Push Notification on mobile & laptop notification bar"
            >
              <span>🔔 Test Notification</span>
            </button>
            <button
              onClick={() => {
                auth.logout();
                refetchGlobalRotation();
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{state.currentDay}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Day</p>
        </div>
        <div className="rounded-xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{state.leaveDays.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave Days</p>
        </div>
        <div className="rounded-xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] p-4 text-center">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            state.isPaused
              ? 'bg-orange-500/10 text-orange-500'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${state.isPaused ? 'bg-orange-500' : 'bg-emerald-500'}`} />
            {state.isPaused ? 'Paused' : 'Active'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Rotation</p>
        </div>
        <div className="rounded-xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] p-4 text-center">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            state.announcement?.active
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-gray-500/10 text-gray-500'
          }`}>
            {state.announcement?.active ? '📢 Live' : 'None'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Announcement</p>
        </div>
      </div>

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Random Seating Generator ────────────────── */}
        <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '150ms' }}>
          <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-lg">🎲</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Random Seating Generator</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate seating layout for Day {state.currentDay}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateRandom}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>🎲 Generate</span>
                </button>
                <button
                  onClick={handleClearRandom}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
                  title="Remove Random Layout"
                >
                  Clear
                </button>
              </div>
              
              {(state.randomLayoutDay === state.currentDay && state.randomLayoutGeneratedAt) || state.holidayRandomDate ? (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    {state.holidayRandomDate ? 'Holiday Random Active' : 'Random Layout Active'}
                  </div>
                  <p className="font-medium text-gray-600">
                    {state.holidayRandomDate 
                      ? `Active for ${state.holidayRandomDate}`
                      : `Generated: ${new Date(state.randomLayoutGeneratedAt).toLocaleString()}`
                    }
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ─── Day Override ─────────────────────────── */}
        <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '100ms' }}>
          <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Day Override</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manually set the rotation day (1–24)</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSetDay} className="p-5">
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                max="24"
                value={dayInput}
                onChange={(e) => setDayInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="1–24"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Set Day
              </button>
            </div>
          </form>
        </div>

        {/* ─── Rotation Control ─────────────────────── */}
        <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '200ms' }}>
          <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                state.isPaused
                  ? 'bg-gradient-to-br from-orange-500 to-red-600'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600'
              }`}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  {state.isPaused ? (
                    <path d="M8 5v14l11-7z" />
                  ) : (
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Rotation Control</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pause or resume auto-rotation</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Status: <span className={`font-semibold ${state.isPaused ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {state.isPaused ? 'Paused' : 'Running'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last advance: {state.lastAdvanceDate}
                </p>
              </div>
              <button
                onClick={handlePause}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  state.isPaused
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/20'
                }`}
              >
                {state.isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Leave Days ───────────────────────────── */}
        <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '300ms' }}>
          <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Leave Days</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mark dates to skip (Sundays auto-skipped)</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <form onSubmit={handleAddLeave} className="flex gap-3">
              <input
                type="date"
                value={leaveInput}
                onChange={(e) => setLeaveInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading || !leaveInput}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {state.leaveDays.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No leave days configured</p>
              ) : (
                state.leaveDays.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium group"
                  >
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <button
                      onClick={() => handleRemoveLeave(date)}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── Announcements ────────────────────────── */}
        <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '400ms' }}>
          <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-lg">📢</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Announcements</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Post messages to students</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <textarea
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="e.g., Exam seating today — check notice board"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleAnnouncement(true)}
                disabled={loading || !announcementInput.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {state.announcement?.active ? 'Update' : 'Publish'}
              </button>
              {state.announcement?.active && (
                <button
                  onClick={() => handleAnnouncement(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {state.announcement?.active && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded-lg px-3 py-2">
                ✓ Announcement is live: "{state.announcement.text}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Seating Editor (Full Width) ────────────────── */}
      <div className="animate-fade-in-up rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden" style={{ animationDelay: '500ms' }}>
        <div className="p-5 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Edit Seating Arrangements</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customize seating for any day (1–24)</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all"
            >
              {showEditor ? 'Hide Editor' : 'Open Editor'}
            </button>
          </div>
        </div>

        {showEditor && (
          <div className="p-5 space-y-5">
            {/* Day selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Day to Edit
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => {
                  const isCustom = allSeating?.[d]?.isCustom;
                  return (
                    <button
                      key={d}
                      onClick={() => setEditDay(d)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                        editDay === d
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                          : isCustom
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="inline-block w-2 h-2 rounded bg-amber-500/30 mr-1" /> = Custom arrangement applied
              </p>
            </div>

            {/* Arrangement editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day {editDay} — Seating (Row 1 → Row 6)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {editArrangement.map((code, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Row {idx + 1}</label>
                    <select
                      value={code}
                      onChange={(e) => {
                        const updated = [...editArrangement];
                        updated[idx] = e.target.value;
                        setEditArrangement(updated);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        code.startsWith('G')
                          ? 'border-pink-500/30 bg-pink-500/5 text-pink-600 dark:text-pink-400 dark:bg-pink-500/5 dark:border-pink-500/20'
                          : 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 dark:bg-blue-500/5 dark:border-blue-500/20'
                      }`}
                    >
                      {VALID_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveSeating}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                💾 Save Changes
              </button>
              <button
                onClick={handleResetSeating}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔔 Notification Testing & Diagnostics */}
      <div className="card p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          🔔 Push Notification Testing
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Test if push notifications are working on your device.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestPush}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🔔 Server Push Test
          </button>
          <button
            onClick={handleDirectNotification}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            📲 Direct Notification Test
          </button>
          <button
            onClick={handleDiagnostics}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            🔍 Run Diagnostics
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-4 pb-8">
        <p className="text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Made with ❤️ for CSE5
        </p>
      </footer>
    </div>
  );
}
