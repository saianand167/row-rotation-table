import React, { useState, useEffect } from 'react';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('phone');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/25">
              📱
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Download & Install App
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Install CSE-5 Super App on your Phone & Laptop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer text-lg font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 1-Click Install Button (When browser supports PWA trigger) */}
        {deferredPrompt ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                ⚡ Ready for 1-Click Direct Install!
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Click to add the full app directly to your home screen or desktop.
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              📥 Install Now
            </button>
          </div>
        ) : isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <span>✅</span>
            <span>App is already installed and running in Standalone App Mode!</span>
          </div>
        ) : null}

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📱</span> Android & iPhone
          </button>
          <button
            onClick={() => setActiveTab('laptop')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'laptop'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>💻</span> Windows & Mac Laptop
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-3 overflow-y-auto max-h-60 pr-1 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {activeTab === 'phone' ? (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🤖</span> On Android (Chrome / Brave / Edge):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                  <li>Open this website link in Google Chrome or your phone browser.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu in the top right corner.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app icon will immediately appear on your phone home screen!</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🍏</span> On iPhone / iPad (Safari):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                  <li>Open this website link in <strong>Safari</strong> on iOS.</li>
                  <li>Tap the <strong>Share button (📤)</strong> at the bottom bar.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen" (➕)</strong>.</li>
                  <li>Tap <strong>Add</strong> at top right. The app is installed!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>💻</span> On Windows & Mac (Chrome / Edge / Brave):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                  <li>Look at the right side of the browser URL / address bar.</li>
                  <li>Click the <strong>Install icon (⊕ or 💻)</strong> or click <strong>Install App</strong>.</li>
                  <li>Click <strong>Install</strong> to add a desktop shortcut and windowed app.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Share & Copy Link Section */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Share this link with anyone to install the app on their device:
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{copied ? '✅' : '🔗'}</span>
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy App Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
