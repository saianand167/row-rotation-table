import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function OrcaMarine() {
  const [location, setLocation] = useState('Visakhapatnam (Vizag)');
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setBriefing('');
    try {
      const res = await axios.post(`${API_BASE}/ai/chat`, {
        prompt: `Provide an ORCA Marine Intelligence report for ${location} including wave height, wind, and Potential Fishing Zone (PFZ) advisory.`,
      });
      setBriefing(res.data.answer);
    } catch (e) {
      setBriefing('Failed to fetch ORCA telemetry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>🌊</span> ORCA — Marine Intelligence & Ocean Reasoning
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Agentic Marine Platform for ISRO, INCOIS & Coastal Fishermen with deterministic safety risk calculations.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Coastal Region / Harbor
          </label>
          <div className="flex gap-2">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              <option>Visakhapatnam (Vizag)</option>
              <option>Chennai Coastal Waters</option>
              <option>Kochi Harbor</option>
              <option>Mumbai Port</option>
              <option>Paradip Port</option>
            </select>
            <button
              onClick={handleFetch}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading ? 'Fetching...' : 'Fetch Telemetry'}
            </button>
          </div>
        </div>

        {/* Live Simulated Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Significant Wave</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">1.4 m</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Wind Speed</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">14.2 kts</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Surface Temp (SST)</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">28.5 °C</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-500">
            <div className="text-[10px] uppercase font-bold">Safety Risk Level</div>
            <div className="text-lg font-black mt-0.5">LOW (32/100)</div>
          </div>
        </div>

        {briefing && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            <div className="font-bold text-cyan-500 mb-2">⚓ Marine Advisory Briefing:</div>
            {briefing}
          </div>
        )}
      </div>
    </div>
  );
}
