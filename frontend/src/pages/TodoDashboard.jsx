import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodo } from '../context/TodoContext';
import {
  getMonthlyTasks, createMonthlyTask, updateMonthlyTask, deleteMonthlyTask,
  getWeeklyTasks, createWeeklyTask, updateWeeklyTask, deleteWeeklyTask,
  getDailyTasks, createDailyTask, updateDailyTask, deleteDailyTask,
  addExistingToDaily, getProgress, generateWeeklyPlan, saveGeneratedWeeklyTasks,
} from '../utils/todoApi';
import ProgressRing from '../components/todo/ProgressRing';
import TaskCard from '../components/todo/TaskCard';
import TaskModal from '../components/todo/TaskModal';
import WeeklyPlanModal from '../components/todo/WeeklyPlanModal';
import { showToast } from '../components/todo/Toast';

export default function TodoDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, logout } = useTodo();

  const [progress, setProgress] = useState({ monthly: { total: 0, completed: 0, percentage: 0 }, weekly: { total: 0, completed: 0, percentage: 0 }, daily: { total: 0, completed: 0, percentage: 0 } });
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [taskModal, setTaskModal] = useState({ open: false, scope: 'monthly', task: null });
  const [weeklyPlanModal, setWeeklyPlanModal] = useState({ open: false, suggestions: [] });
  const [addToDayModal, setAddToDayModal] = useState(false);

  // Active section
  const [activeSection, setActiveSection] = useState('overview');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/todo', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchAllData = useCallback(async () => {
    try {
      const [prog, monthly, weekly, daily] = await Promise.all([
        getProgress(),
        getMonthlyTasks(),
        getWeeklyTasks(),
        getDailyTasks(),
      ]);
      setProgress(prog);
      setMonthlyTasks(monthly.tasks || []);
      setWeeklyTasks(weekly.tasks || []);
      setDailyTasks(daily.tasks || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/todo', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // ─── Task CRUD Handlers ─────────────────────────────────

  const handleSaveTask = async (taskData, taskId) => {
    const scope = taskModal.scope;
    try {
      if (taskId) {
        // Update
        const updateFn = scope === 'monthly' ? updateMonthlyTask : scope === 'weekly' ? updateWeeklyTask : updateDailyTask;
        await updateFn(taskId, taskData);
        showToast('Task updated successfully.', 'success');
      } else {
        // Create
        const createFn = scope === 'monthly' ? createMonthlyTask : scope === 'weekly' ? createWeeklyTask : createDailyTask;
        await createFn(taskData);
        showToast('Task created successfully.', 'success');
      }
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save task.', 'error');
      throw err;
    }
  };

  const handleStatusChange = async (taskId, newStatus, scope) => {
    try {
      const updateFn = scope === 'monthly' ? updateMonthlyTask : scope === 'weekly' ? updateWeeklyTask : updateDailyTask;
      await updateFn(taskId, { status: newStatus });
      fetchAllData();
    } catch (err) {
      showToast('Failed to update task status.', 'error');
    }
  };

  const handleDeleteTask = async (taskId, scope) => {
    if (!confirm('Delete this task?')) return;
    try {
      const deleteFn = scope === 'monthly' ? deleteMonthlyTask : scope === 'weekly' ? deleteWeeklyTask : deleteDailyTask;
      await deleteFn(taskId);
      showToast('Task deleted successfully.', 'success');
      fetchAllData();
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleAddToToday = async (task) => {
    try {
      await addExistingToDaily(task._id);
      showToast('Task added to today\'s agenda.', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add to today.', 'error');
    }
  };

  const handleGenerateWeeklyPlan = async () => {
    try {
      const data = await generateWeeklyPlan();
      if (data.suggestions.length === 0) {
        showToast('No pending monthly tasks to plan from.', 'info');
        return;
      }
      setWeeklyPlanModal({ open: true, suggestions: data.suggestions });
    } catch (err) {
      showToast('Failed to generate weekly plan.', 'error');
    }
  };

  const handleSaveWeeklyPlan = async (tasks) => {
    try {
      await saveGeneratedWeeklyTasks(tasks);
      showToast(`${tasks.length} weekly tasks created!`, 'success');
      fetchAllData();
    } catch (err) {
      showToast('Failed to save weekly plan.', 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/todo', { replace: true });
  };

  // ─── Group weekly tasks by day ──────────────────────────
  const weeklyByDay = {};
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  dayOrder.forEach((d) => { weeklyByDay[d] = []; });
  weeklyByDay['unassigned'] = [];
  weeklyTasks.forEach((t) => {
    const day = t.dayOfWeek || 'unassigned';
    if (!weeklyByDay[day]) weeklyByDay[day] = [];
    weeklyByDay[day].push(t);
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'monthly', label: 'Monthly', icon: '📅' },
    { id: 'weekly', label: 'Weekly', icon: '📆' },
    { id: 'daily', label: 'Today', icon: '☀️' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome, {user?.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your tasks and track your progress</p>
        </div>
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

      {/* Section Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 p-1 mb-6 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSection === s.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Progress Cards */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>📊</span> My Productivity
            </h2>
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <ProgressRing percentage={progress.monthly.percentage} color="#10b981" label="Monthly" />
              <ProgressRing percentage={progress.weekly.percentage} color="#6366f1" label="Weekly" />
              <ProgressRing percentage={progress.daily.percentage} color="#f59e0b" label="Today" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">{progress.monthly.completed}/{progress.monthly.total} done</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">{progress.weekly.completed}/{progress.weekly.total} done</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">{progress.daily.completed}/{progress.daily.total} done</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { setTaskModal({ open: true, scope: 'monthly', task: null }); }}
              className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
            >
              <span className="text-2xl">📅</span>
              <h3 className="text-sm font-bold text-gray-800 mt-2 group-hover:text-emerald-600 transition-colors">Add Monthly Task</h3>
              <p className="text-xs text-gray-400 mt-0.5">Set your monthly goals</p>
            </button>
            <button
              onClick={handleGenerateWeeklyPlan}
              className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <span className="text-2xl">✨</span>
              <h3 className="text-sm font-bold text-gray-800 mt-2 group-hover:text-indigo-600 transition-colors">Plan Week</h3>
              <p className="text-xs text-gray-400 mt-0.5">Auto-generate from monthly</p>
            </button>
            <button
              onClick={() => { setTaskModal({ open: true, scope: 'daily', task: null }); }}
              className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all text-left group"
            >
              <span className="text-2xl">☀️</span>
              <h3 className="text-sm font-bold text-gray-800 mt-2 group-hover:text-amber-600 transition-colors">Add Today's Task</h3>
              <p className="text-xs text-gray-400 mt-0.5">Plan your day</p>
            </button>
          </div>

          {/* Today's Tasks Preview */}
          {dailyTasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span>☀️</span> Today's Agenda
                </h2>
                <button
                  onClick={() => setActiveSection('daily')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2">
                {dailyTasks.slice(0, 4).map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={(id, status) => handleStatusChange(id, status, 'daily')}
                    onEdit={(t) => setTaskModal({ open: true, scope: 'daily', task: t })}
                    onDelete={(id) => handleDeleteTask(id, 'daily')}
                  />
                ))}
                {dailyTasks.length > 4 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{dailyTasks.length - 4} more tasks
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MONTHLY ═══ */}
      {activeSection === 'monthly' && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span>📅</span> Monthly Agenda
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  {progress.monthly.completed}/{progress.monthly.total}
                </span>
              </h2>
              <button
                onClick={() => setTaskModal({ open: true, scope: 'monthly', task: null })}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Task
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.monthly.percentage}%` }}
              />
            </div>

            {monthlyTasks.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📝</span>
                <p className="text-sm text-gray-400 mt-2">No monthly tasks yet. Add your first goal!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {monthlyTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={(id, status) => handleStatusChange(id, status, 'monthly')}
                    onEdit={(t) => setTaskModal({ open: true, scope: 'monthly', task: t })}
                    onDelete={(id) => handleDeleteTask(id, 'monthly')}
                    onAddToToday={handleAddToToday}
                    showAddToToday
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ WEEKLY ═══ */}
      {activeSection === 'weekly' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span>📆</span> This Week
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                  {progress.weekly.completed}/{progress.weekly.total}
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateWeeklyPlan}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                >
                  ✨ Plan Week
                </button>
                <button
                  onClick={() => setTaskModal({ open: true, scope: 'weekly', task: null })}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.weekly.percentage}%` }}
              />
            </div>

            {weeklyTasks.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📋</span>
                <p className="text-sm text-gray-400 mt-2">No weekly tasks. Generate from monthly or add manually!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...dayOrder, 'unassigned'].map((day) => {
                  const tasks = weeklyByDay[day] || [];
                  if (tasks.length === 0) return null;
                  return (
                    <div key={day}>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 capitalize flex items-center gap-1.5">
                        {day === 'unassigned' ? '📌 Unassigned' : `${day}`}
                      </h3>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={(id, status) => handleStatusChange(id, status, 'weekly')}
                            onEdit={(t) => setTaskModal({ open: true, scope: 'weekly', task: t })}
                            onDelete={(id) => handleDeleteTask(id, 'weekly')}
                            onAddToToday={handleAddToToday}
                            showAddToToday
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DAILY ═══ */}
      {activeSection === 'daily' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span>☀️</span> Today's Agenda
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                  {progress.daily.completed}/{progress.daily.total}
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddToDayModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                >
                  📋 From Existing
                </button>
                <button
                  onClick={() => setTaskModal({ open: true, scope: 'daily', task: null })}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.daily.percentage}%` }}
              />
            </div>

            {dailyTasks.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">🌅</span>
                <p className="text-sm text-gray-400 mt-2">No tasks for today. Start planning your day!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={(id, status) => handleStatusChange(id, status, 'daily')}
                    onEdit={(t) => setTaskModal({ open: true, scope: 'daily', task: t })}
                    onDelete={(id) => handleDeleteTask(id, 'daily')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Add From Existing Modal ═══ */}
      {addToDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" style={{ animation: 'scaleIn 0.2s ease' }}>
            <button
              onClick={() => setAddToDayModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Add to Today</h3>
            <p className="text-xs text-gray-500 mb-4">Select a task from your monthly or weekly agenda</p>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Monthly tasks */}
              {monthlyTasks.filter((t) => t.status !== 'completed').length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📅 Monthly Tasks</h4>
                  <div className="space-y-1.5">
                    {monthlyTasks.filter((t) => t.status !== 'completed').map((task) => (
                      <button
                        key={task._id}
                        onClick={async () => {
                          await handleAddToToday(task);
                          setAddToDayModal(false);
                        }}
                        className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                      >
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm font-medium text-gray-800 truncate">{task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly tasks */}
              {weeklyTasks.filter((t) => t.status !== 'completed').length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📆 Weekly Tasks</h4>
                  <div className="space-y-1.5">
                    {weeklyTasks.filter((t) => t.status !== 'completed').map((task) => (
                      <button
                        key={task._id}
                        onClick={async () => {
                          await handleAddToToday(task);
                          setAddToDayModal(false);
                        }}
                        className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                      >
                        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm font-medium text-gray-800 truncate">{task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {monthlyTasks.filter((t) => t.status !== 'completed').length === 0 &&
               weeklyTasks.filter((t) => t.status !== 'completed').length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No available tasks to add.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Task Create/Edit Modal ═══ */}
      <TaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, scope: 'monthly', task: null })}
        onSave={handleSaveTask}
        task={taskModal.task}
        scope={taskModal.scope}
      />

      {/* ═══ Weekly Plan Modal ═══ */}
      <WeeklyPlanModal
        isOpen={weeklyPlanModal.open}
        onClose={() => setWeeklyPlanModal({ open: false, suggestions: [] })}
        suggestions={weeklyPlanModal.suggestions}
        onSave={handleSaveWeeklyPlan}
      />
    </div>
  );
}
