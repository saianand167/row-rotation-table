import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VideoAI() {
  const [url, setUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setSummary('');
    setVideoInfo(null);
    try {
      const res = await axios.post(`${API_BASE}/ai/video/summarize`, {
        url: url.trim(),
        question: question.trim() || undefined,
      });
      setSummary(res.data.summary);
      if (res.data.title || res.data.author || res.data.thumbnailUrl) {
        setVideoInfo({
          title: res.data.title,
          author: res.data.author,
          thumbnailUrl: res.data.thumbnailUrl,
        });
      }
    } catch (e) {
      setSummary('⚠️ Failed to process video. Please check your YouTube link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
          Real-Time Video Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>🎥</span> YouTube & Video AI Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Paste any YouTube URL (lecture, tutorial, music video, or trailer) to identify verified video metadata, generate executive chapter notes, or ask specific questions.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            YouTube Video URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Optional Specific Question (Leave empty for full summary & quiz)
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is this video? or Who composed the music?"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading || !url.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-red-500/20 hover:from-red-600 hover:to-rose-700 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Video & Fetching Ground Truth...</span>
            </>
          ) : (
            <span>🚀 Generate Video Summary & Analysis</span>
          )}
        </button>

        {/* Video Metadata Preview Card */}
        {videoInfo && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            {videoInfo.thumbnailUrl && (
              <img
                src={videoInfo.thumbnailUrl}
                alt={videoInfo.title}
                className="w-full sm:w-36 h-24 object-cover rounded-xl shadow-xs"
              />
            )}
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Verified YouTube Content</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{videoInfo.title}</div>
              <div className="text-xs text-slate-400">Channel / Label: {videoInfo.author || 'YouTube Channel'}</div>
            </div>
          </div>
        )}

        {/* Analysis Output */}
        {summary && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            <div className="font-bold text-red-500 mb-3 flex items-center gap-2">
              <span>📑</span> Video Intelligence Report:
            </div>
            <div className="text-slate-800 dark:text-slate-200">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
