import { useState } from 'react';
import { verifyPin } from '../utils/api';

export default function AdminLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await verifyPin(pin);

      if (data.success) {
        onLogin(pin);
      } else {
        setError('Invalid password. Access denied.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError('Connection failed. Is the server running?');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div
        className={`w-full max-w-sm animate-fade-in-up ${shake ? 'animate-shake' : ''}`}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Admin Access
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
          Enter your password to access the admin panel
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter admin password"
              maxLength={20}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest placeholder:tracking-normal placeholder:text-sm placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Unlock'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
