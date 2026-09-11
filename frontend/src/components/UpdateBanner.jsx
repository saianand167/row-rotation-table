import React from 'react';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

export default function UpdateBanner() {
  const { updateAvailable, updateApp, dismissUpdate } = usePWAUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-slide-down">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl border border-emerald-400/40 flex items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight">New App Version Ready!</div>
            <div className="text-xs text-emerald-100 font-medium">Update to get latest features & AI models.</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={updateApp}
            className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 font-extrabold text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
          >
            Update Now
          </button>
          <button
            onClick={dismissUpdate}
            className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center text-white/80 hover:text-white text-sm font-bold transition-all cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
