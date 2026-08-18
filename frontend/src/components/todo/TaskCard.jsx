import { useState } from 'react';

const priorityColors = {
  high: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20',
  medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  low: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const statusIcons = {
  pending: (
    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 cursor-pointer hover:border-emerald-400 transition-colors" />
  ),
  in_progress: (
    <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-50 dark:bg-amber-500/20 flex-shrink-0 cursor-pointer flex items-center justify-center transition-colors">
      <div className="w-2 h-2 rounded-full bg-amber-400" />
    </div>
  ),
  completed: (
    <div className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 cursor-pointer flex items-center justify-center transition-colors">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
};

export default function TaskCard({ task, onStatusChange, onEdit, onDelete, onAddToToday, showAddToToday = false }) {
  const [showActions, setShowActions] = useState(false);

  const nextStatus = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'pending',
  };

  const handleStatusClick = () => {
    const next = nextStatus[task.status];
    onStatusChange?.(task._id, next);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md ${
        task.status === 'completed'
          ? 'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
          : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/70 hover:border-emerald-300 dark:hover:border-emerald-500/40'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Status checkbox */}
      <button onClick={handleStatusClick} className="mt-0.5" title={`Status: ${task.status}`}>
        {statusIcons[task.status]}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={`text-sm font-semibold transition-all ${
              task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-900 dark:text-white'
            }`}
          >
            {task.title}
          </h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
        </div>

        {task.description && (
          <p className={`text-xs mt-1 ${task.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {task.deadline && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(task.deadline)}
            </span>
          )}
          {task.sourceTaskId && (
            <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Linked
            </span>
          )}
        </div>
      </div>

      {/* Action buttons (always accessible on touch devices, hover on desktop) */}
      <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-100'}`}>
        {showAddToToday && task.status !== 'completed' && (
          <button
            onClick={() => onAddToToday?.(task)}
            className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
            title="Add to today"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onEdit?.(task)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete?.(task._id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
