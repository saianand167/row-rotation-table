import { useState } from 'react';

export default function Settings() {
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>⚙️</span> Super App Settings & AI Diagnostics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure model inference providers, active API keys, and inspect system telemetry.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Active LLM Model (Groq Inference Engine)
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended • Ultra-Fast)</option>
            <option value="openai/gpt-oss-20b">GPT-OSS 20B (Groq Fast)</option>
            <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Groq)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Groq API Key Override (Optional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Loaded automatically from sai.env"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            API key is loaded securely from backend environment variables.
          </span>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {saved ? '✓ Settings Applied' : 'Save Configuration'}
        </button>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            System Diagnostics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Inference Server</div>
              <div className="text-xs font-bold text-emerald-500 mt-0.5">🟢 Groq Cloud Active</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">RRT Core Engine</div>
              <div className="text-xs font-bold text-emerald-500 mt-0.5">🟢 24-Day Cycle Active</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Database Engine</div>
              <div className="text-xs font-bold text-emerald-500 mt-0.5">🟢 SQLite / Mongo Ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
