export function StatusBadge({ status = 'Online', size = 'sm' }) {
  const isHealthy = ['online', 'ready', 'healthy', 'active', 'success'].includes(status.toLowerCase());
  const isWarning = ['degraded', 'warning', 'paused', 'processing'].includes(status.toLowerCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${
        isHealthy
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          : isWarning
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isHealthy ? 'bg-emerald-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
        }`}
      />
      {status}
    </span>
  );
}

export function EmptyState({
  icon = '📁',
  title = 'No Items Yet',
  description = 'Get started by creating or uploading your first item.',
  actionText = '',
  onAction = null,
}) {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm space-y-3">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mx-auto shadow-xs">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white text-base">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
