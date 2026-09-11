import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import DownloadAppModal from '../components/DownloadAppModal';

export default function Dashboard() {
  const { rotationData, loading } = useApp();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const seatCodes = rotationData?.seating || [];
  const isHoliday = rotationData?.isHoliday;
  const currentDay = rotationData?.currentDay;

  // Exactly 8 AI Capability Modules ordered logically in two 4-card rows
  const aiCapabilities = [
    // Row 1: Core AI & Multimodal Intelligence
    {
      title: 'AI Orchestrator',
      desc: 'Multi-tool assistant with auto-routing & search.',
      icon: '🤖',
      path: '/ai-chat',
      status: 'Online',
    },
    {
      title: 'Document & RAG AI',
      desc: 'Knowledge base with clickable page citations.',
      icon: '📄',
      path: '/rag',
      status: 'Ready',
    },
    {
      title: 'Business / Data AI',
      desc: 'Statistical profiling for CSV & Excel datasets.',
      icon: '📊',
      path: '/data-analytics',
      status: 'Online',
    },
    {
      title: 'Vision & Image AI',
      desc: 'Multimodal vision for diagrams & documents.',
      icon: '🖼️',
      path: '/vision-ai',
      status: 'Online',
    },
    // Row 2: Specialized Analytical & Domain Tools
    {
      title: 'SQL Database AI',
      desc: 'Safe read-only natural language database queries.',
      icon: '🗄️',
      path: '/database-ai',
      status: 'Protected',
    },
    {
      title: 'Voice & Audio AI',
      desc: 'Speech transcription & multilingual voice synthesis.',
      icon: '🎙️',
      path: '/voice-ai',
      status: 'Ready',
    },
    {
      title: 'YouTube & Video AI',
      desc: 'Lecture outlines, executive summaries & quizzes.',
      icon: '🎥',
      path: '/video-ai',
      status: 'Online',
    },
    {
      title: 'Healthcare & MediKiosk',
      desc: 'Symptom intake, triage levels & clinical notes.',
      icon: '🏥',
      path: '/healthcare',
      status: 'Assistive',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in w-full max-w-full box-border pb-6">
      {/* 1. TOP HERO: Generative AI Super App (Compact & Modern) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border border-slate-800/80 p-4 sm:p-7 lg:p-8 shadow-xl max-w-full box-border">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5 max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate">CSE-5 Unified Operating System</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Generative AI Super App
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Unified workspace for classroom seating automation, permanent knowledge RAG, safe SQL analytics, and specialized AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/ai-chat"
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🤖</span>
              <span>Launch AI Assistant</span>
            </Link>
            <Link
              to="/class-view"
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm border border-slate-700 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🪑</span>
              <span>Row Rotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S ROW ROTATION: Compact Card */}
      <div className="w-full max-w-full bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-sm backdrop-blur-xl box-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold text-lg shrink-0">
              🪑
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Today's Row Rotation
                </h2>
                {!loading && (
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    {isHoliday ? '🏖️ Paused' : `Day ${currentDay || 1} of 24`}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                24-Day Deterministic Seating Layout
              </p>
            </div>
          </div>

          <Link
            to="/class-view"
            className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>Full View</span>
            <span>→</span>
          </Link>
        </div>

        {/* Compact Seating Row Matrix / Holiday Notice */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {loading ? (
            <div className="py-2 text-center text-xs text-slate-500">
              Loading seating arrangement...
            </div>
          ) : isHoliday ? (
            <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs text-center font-medium">
              🏖️ Today is a weekend or scheduled holiday. Rotation paused.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {seatCodes.map((s, idx) => {
                const isGirl = s.type === 'girl';
                return (
                  <div
                    key={idx}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all min-w-0 ${
                      isGirl
                        ? 'bg-pink-500/10 border-pink-500/25 text-pink-600 dark:text-pink-400'
                        : 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">
                      Row {s.row || idx + 1}
                    </div>
                    <div className="text-base sm:text-lg font-black tracking-tight truncate">
                      {s.code}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. ANNOUNCEMENTS: Compact Card */}
      <div className="w-full max-w-full bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-sm backdrop-blur-xl box-border">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 flex items-center justify-center font-bold text-base shrink-0">
              📢
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Announcements
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Classroom Broadcasts
              </p>
            </div>
          </div>
          <Link
            to="/todo"
            className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 shrink-0"
          >
            <span>Tasks</span>
            <span>→</span>
          </Link>
        </div>

        {rotationData?.announcement?.active && rotationData?.announcement?.text ? (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm font-medium break-words leading-relaxed">
            {rotationData.announcement.text}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-500 dark:text-slate-400">
            No active announcements right now.
          </div>
        )}
      </div>

      {/* 4. AI CAPABILITIES HUB: Compact 8-Card Responsive Grid */}
      <div className="space-y-3 pt-1 max-w-full box-border">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>⚡</span>
              <span>AI Capabilities Hub</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Specialized AI tools and workflows in one application.
            </p>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            ● 8 Modules
          </span>
        </div>

        {/* Compact Grid: 2 columns on Mobile, 3 on Tablet, 4 on Desktop (2 rows of 4) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 max-w-full box-border">
          {aiCapabilities.map((cap, idx) => (
            <Link
              key={idx}
              to={cap.path}
              className="group p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 flex flex-col justify-between min-w-0 max-w-full box-border hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-lg sm:text-xl group-hover:scale-105 group-hover:bg-emerald-500/10 transition-all shrink-0">
                    {cap.icon}
                  </div>
                  <StatusBadge status={cap.status} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors text-xs sm:text-sm truncate">
                  {cap.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                <span>Launch Studio</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
