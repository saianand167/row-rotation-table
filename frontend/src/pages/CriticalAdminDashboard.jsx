import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCriticalAdminStats,
  getCriticalAdminUsers,
  getCriticalAdminSessions,
  getCriticalAdminVisitors,
  getCriticalAdminUserTasks,
  getCriticalAdminAllTasks,
  deleteCriticalAdminUser,
  disableCriticalAdminUser,
  revokeCriticalAdminSession,
  clearCriticalAdminToken,
} from '../utils/todoApi';
import { showToast } from '../components/todo/Toast';

export default function CriticalAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Inspection & Modals
  const [inspectUser, setInspectUser] = useState(null); // User task inspection modal data
  const [inspectLoading, setInspectLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [s, u, sess, vis, tasks] = await Promise.all([
        getCriticalAdminStats(),
        getCriticalAdminUsers(),
        getCriticalAdminSessions(),
        getCriticalAdminVisitors(),
        getCriticalAdminAllTasks(),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setSessions(sess.sessions || []);
      setVisitors(vis.visitors || []);
      setAllTasks(tasks.tasks || []);
    } catch (err) {
      if (err.response?.status === 401) {
        showToast('Admin session expired. Please log in again.', 'error');
        navigate('/critical-admin', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInspectUserTasks = async (user) => {
    setInspectLoading(true);
    try {
      const data = await getCriticalAdminUserTasks(user._id);
      setInspectUser(data);
    } catch (err) {
      showToast('Failed to load user tasks.', 'error');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    try {
      await deleteCriticalAdminUser(userId);
      showToast(`User "${username}" deleted successfully.`, 'success');
      setDeleteConfirm(null);
      setInspectUser(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user.', 'error');
    }
  };

  const handleDisableUser = async (userId, disabled) => {
    try {
      await disableCriticalAdminUser(userId, disabled);
      showToast(disabled ? 'User disabled.' : 'User enabled.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update user status.', 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeCriticalAdminSession(sessionId);
      showToast('Session revoked.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to revoke session.', 'error');
    }
  };

  const handleLogout = () => {
    clearCriticalAdminToken();
    navigate('/critical-admin', { replace: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = diffMs / (1000 * 60);
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffMin < 2) return 'Just now';
    if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priorityColors = {
    high: 'bg-red-50 text-red-600 border-red-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    low: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🛡️ Critical Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Live monitoring, IP visitor logs & full user data inspection</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 p-1 mb-6 overflow-x-auto shadow-sm">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'users', label: `👥 Users & Tasks (${users.length})` },
          { id: 'all_tasks', label: `📋 All Tasks (${allTasks.length})` },
          { id: 'visitors', label: `🌐 Visitor IPs (${visitors.length})` },
          { id: 'sessions', label: `🔌 Active Sessions (${sessions.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Live Active Online Users */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Online Users</p>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.liveActiveUsers || stats.activeSessions}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Active right now on web</p>
            </div>

            {/* Registered Users Capacity */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers} <span className="text-base text-gray-400 font-normal">/ {stats.maxUsers}</span></p>
              <p className="text-xs text-gray-400 mt-1">{stats.availableSlots} available slots</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.totalUsers / stats.maxUsers) * 100}%` }}
                />
              </div>
            </div>

            {/* Unique IP Visitors */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unique Visitor IPs</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalUniqueVisitors || visitors.length}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalWebHits || 0} total web hits</p>
            </div>

            {/* Total Tasks Created */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tasks Created</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalTasks || allTasks.length}</p>
              <p className="text-xs text-gray-400 mt-1">across all users</p>
            </div>
          </div>

          {/* Quick Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Sessions Quick Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>🔌</span> Currently Active Sessions
                </h3>
                <button onClick={() => setActiveTab('sessions')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  View All →
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No active logged-in sessions.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 4).map((s) => (
                    <div key={s._id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-gray-800">{s.username}</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[10px]">{s.ipAddress || '127.0.0.1'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent IP Visitors Quick Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>🌐</span> Recent Web Visitors (IPs)
                </h3>
                <button onClick={() => setActiveTab('visitors')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View All →
                </button>
              </div>
              {visitors.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No IP visitor logs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {visitors.slice(0, 4).map((v) => (
                    <div key={v._id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{v.ipAddress}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{v.visitCount} visits</span>
                      </div>
                      <span className="text-gray-400 text-[10px]">{formatDate(v.lastVisitAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ USERS & TASKS TAB ═══ */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">User Accounts & Task Inspector</h2>
              <p className="text-xs text-gray-500">Click "Inspect Tasks" to view everything a user has added</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {users.length} / 100 registered
            </span>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">👤</span>
              <p className="text-sm text-gray-400 mt-2">No registered users yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tasks Created</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Registered</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Last Login</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                            {u.username[0]}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          u.status === 'Disabled' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {u.taskCount || 0} tasks ({u.completedTaskCount || 0} done)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{formatDate(u.lastLoginAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Tasks Button */}
                          <button
                            onClick={() => handleInspectUserTasks(u)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                          >
                            👁️ Inspect Tasks
                          </button>
                          <button
                            onClick={() => handleDisableUser(u._id, !u.isDisabled)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              u.isDisabled
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                          >
                            {u.isDisabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ ALL TASKS TAB ═══ */}
      {activeTab === 'all_tasks' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">All User Added Tasks ({allTasks.length})</h2>
            <p className="text-xs text-gray-500">Live feed of all tasks created across all user accounts</p>
          </div>

          {allTasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-gray-400 mt-2">No tasks added by any user yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allTasks.map((t) => (
                <div key={t._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                    t.status === 'completed' ? 'bg-emerald-500' :
                    t.status === 'in_progress' ? 'bg-amber-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        👤 {t.userId?.username || 'User'}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{t.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${priorityColors[t.priority]}`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded capitalize">
                        {t.scope} agenda
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">Created {formatDate(t.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ VISITOR IPS TAB ═══ */}
      {activeTab === 'visitors' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Web Visitor IP Address Logs</h2>
              <p className="text-xs text-gray-500">Track how many unique people & devices reached the website</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {visitors.length} Unique IPs
              </span>
            </div>
          </div>

          {visitors.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🌐</span>
              <p className="text-sm text-gray-400 mt-2">No IP visitor logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Visits</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Visit Time</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">User Agent / Device Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visitors.map((v) => (
                    <tr key={v._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          {v.ipAddress}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-gray-800">{v.visitCount} visits</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {formatDate(v.lastVisitAt)}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell max-w-xs">
                        <span className="text-[10px] text-gray-400 truncate block" title={v.userAgent}>
                          {v.userAgent || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ SESSIONS TAB ═══ */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Active Logged-In Sessions ({sessions.length})</h2>
            <p className="text-xs text-gray-500">Users currently logged in with active JWT sessions</p>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🔌</span>
              <p className="text-sm text-gray-400 mt-2">No active sessions.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{session.username}</span>
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {session.ipAddress || '127.0.0.1'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Active: {formatDate(session.lastActiveAt)} · Device: {session.userAgent ? session.userAgent.slice(0, 40) + '...' : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session._id)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Revoke Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INSPECT USER TASKS MODAL ═══ */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
            <button
              onClick={() => setInspectUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold uppercase shadow-lg shadow-indigo-500/25">
                {inspectUser.user?.username?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  User: {inspectUser.user?.username}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inspectUser.user?.isDisabled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {inspectUser.user?.isDisabled ? 'Disabled' : 'Active Account'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Total Tasks: <strong>{inspectUser.stats?.total}</strong> · Completed: <strong>{inspectUser.stats?.completed}</strong> · Pending: <strong>{inspectUser.stats?.pending}</strong>
                </p>
              </div>
            </div>

            {/* Task Lists */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {inspectUser.tasks?.all?.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-3xl">📭</span>
                  <p className="text-xs text-gray-400 mt-2">This user has not added any tasks yet.</p>
                </div>
              ) : (
                <>
                  {/* Monthly Agenda */}
                  {inspectUser.tasks?.monthly?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📅 Monthly Agenda ({inspectUser.tasks.monthly.length})</h4>
                      <div className="space-y-2">
                        {inspectUser.tasks.monthly.map((t) => (
                          <div key={t._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-xs font-semibold ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {t.title}
                              </p>
                              {t.description && <p className="text-[11px] text-gray-500 mt-0.5">{t.description}</p>}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${priorityColors[t.priority]}`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Agenda */}
                  {inspectUser.tasks?.weekly?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📆 Weekly Tasks ({inspectUser.tasks.weekly.length})</h4>
                      <div className="space-y-2">
                        {inspectUser.tasks.weekly.map((t) => (
                          <div key={t._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-xs font-semibold ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {t.title}
                              </p>
                              {t.dayOfWeek && <span className="text-[10px] text-indigo-500 capitalize">{t.dayOfWeek}</span>}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${priorityColors[t.priority]}`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Agenda */}
                  {inspectUser.tasks?.daily?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">☀️ Today's Agenda ({inspectUser.tasks.daily.length})</h4>
                      <div className="space-y-2">
                        {inspectUser.tasks.daily.map((t) => (
                          <div key={t._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-xs font-semibold ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {t.title}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${priorityColors[t.priority]}`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5C3.498 17.333 4.46 19 6 19z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to permanently delete <strong>{deleteConfirm.username}</strong>?
              </p>
              <p className="text-xs text-red-500 mt-2 font-medium">
                This will delete the user's To-Do data and account. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm._id, deleteConfirm.username)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
