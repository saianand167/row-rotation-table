import { useState } from 'react';

export default function WeeklyPlanModal({ isOpen, onClose, suggestions = [], onSave }) {
  const [selectedTasks, setSelectedTasks] = useState(() =>
    suggestions.map((s) => ({ ...s, selected: true, edited: false }))
  );
  const [saving, setSaving] = useState(false);

  // Reset when suggestions change
  if (isOpen && suggestions.length > 0 && selectedTasks.length === 0) {
    setSelectedTasks(suggestions.map((s) => ({ ...s, selected: true, edited: false })));
  }

  if (!isOpen) return null;

  const toggleTask = (index) => {
    setSelectedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTaskTitle = (index, newTitle) => {
    setSelectedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, title: newTitle, edited: true } : t))
    );
  };

  const handleSave = async () => {
    const tasksToSave = selectedTasks.filter((t) => t.selected);
    if (tasksToSave.length === 0) return;

    setSaving(true);
    try {
      await onSave(tasksToSave);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedTasks.filter((t) => t.selected).length;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  // Group by week
  const grouped = {};
  selectedTasks.forEach((task, index) => {
    const week = task.weekNumber || 1;
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push({ ...task, originalIndex: index });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Plan Suggestions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Review, edit, or deselect suggestions before saving</p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No pending monthly tasks to generate plans from.</p>
          </div>
        ) : (
          <>
            {/* Task list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([weekNum, tasks]) => (
                <div key={weekNum}>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      {weekNum}
                    </span>
                    Week {weekNum}
                  </h4>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.originalIndex}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          task.selected
                            ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.originalIndex)}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.selected ? (
                            <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </button>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTaskTitle(task.originalIndex, e.target.value)}
                            className="w-full text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          />
                          {task.sourceTitle && (
                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5">
                              From: {task.sourceTitle}
                            </p>
                          )}
                          {task.dayOfWeek && (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 capitalize">
                              {task.dayOfWeek}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {selectedCount} of {selectedTasks.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selectedCount === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? 'Saving...' : `Save ${selectedCount} Tasks`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
