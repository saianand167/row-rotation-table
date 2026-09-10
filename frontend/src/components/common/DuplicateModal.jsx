export default function DuplicateModal({
  isOpen,
  onClose,
  existingDoc,
  onAskAI,
  onOpenExisting,
}) {
  if (!isOpen || !existingDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-2xl mb-4 shadow-sm">
            📄
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            Duplicate Protected
          </span>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Document Already Exists
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">"{existingDoc.filename}"</strong> is already present in your permanent Knowledge Base. Identical copies are not duplicated to preserve storage integrity.
          </p>

          {/* Existing Doc Metadata Card */}
          <div className="mt-4 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Pages:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{existingDoc.pageCount || 1} pages</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Indexed Chunks:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{existingDoc.totalChunks || 'Indexed'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Upload Date:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {existingDoc.uploadedAt ? new Date(existingDoc.uploadedAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-500">Ready in Knowledge Base</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 w-full flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                if (onAskAI) onAskAI(existingDoc);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              🤖 Ask AI About This Doc
            </button>
            <button
              onClick={() => {
                if (onOpenExisting) onOpenExisting(existingDoc);
                onClose();
              }}
              className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
