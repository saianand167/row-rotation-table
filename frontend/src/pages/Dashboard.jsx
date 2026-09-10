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

  const aiCapabilities = [
    {
      title: 'AI Orchestrator',
      desc: 'Multi-tool assistant with auto-intent routing, live search, and reasoning telemetry.',
      icon: '🤖',
      path: '/ai-chat',
      status: 'Online',
    },
    {
      title: 'Document & RAG AI',
      desc: 'Permanent Knowledge Base with SHA-256 deduplication and clickable page citations.',
      icon: '📄',
      path: '/rag',
      status: 'Ready',
    },
    {
      title: 'Vision & Image AI',
      desc: 'Multimodal vision for diagrams, flowcharts, screenshots, and handwritten notes.',
      icon: '🖼️',
      path: '/vision-ai',
      status: 'Online',
    },
    {
      title: 'CSV Data Analytics',
      desc: 'Automated statistical profiling for CSV, Excel, and JSON datasets with insights.',
      icon: '📊',
      path: '/data-analytics',
      status: 'Online',
    },
    {
      title: 'SQL Database AI',
      desc: 'Safe read-only SQL studio with strict query validation and natural language answers.',
      icon: '🗄️',
      path: '/database-ai',
      status: 'Protected',
    },
    {
      title: 'Voice & Audio AI',
      desc: 'Continuous real-time speech transcription and voice synthesis in English, Hindi, & Telugu.',
      icon: '🎙️',
      path: '/voice-ai',
      status: 'Ready',
    },
    {
      title: 'YouTube & Video AI',
      desc: 'Paste lecture URLs for chapter outlines, executive summaries, and interactive quizzes.',
      icon: '🎥',
      path: '/video-ai',
      status: 'Online',
    },
    {
      title: 'ORCA Marine AI',
      desc: 'ISRO ocean telemetry, potential fishing zones, and deterministic marine risk score.',
      icon: '🌊',
      path: '/orca',
      status: 'Online',
    },
    {
      title: 'Healthcare & MediKiosk',
      desc: 'Structured symptom intake, red flag triage level, and doctor consultation notes.',
      icon: '🏥',
      path: '/healthcare',
      status: 'Assistive',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border border-slate-800/80 p-8 sm:p-12 lg:p-14 shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              CSE-5 Unified AI Operating System
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Generative AI Super App
            </h1>
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed">
              Your unified workspace for classroom seating automation, permanent knowledge RAG, safe SQL analytics, multi-modal vision, and specialized intelligence agents.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4 shrink-0">
            <Link
              to="/ai-chat"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">🤖</span> Launch AI Assistant
            </Link>
            <Link
              to="/class-view"
              className="px-7 py-4 rounded-2xl bg-slate-800/95 hover:bg-slate-700 text-white font-extrabold text-base border border-slate-700/80 backdrop-blur-md hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer shadow-lg"
            >
              <span className="text-2xl">🪑</span> Row Rotation
            </Link>
          </div>
        </div>
      </div>

      {/* Row Rotation Seating & Announcements Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Today's Rotation Seating Preview */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900/90 rounded-3xl p-7 sm:p-9 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold text-2xl shadow-sm">
                  🪑
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Today's Row Rotation
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    24-Day Deterministic Cycle Seating Arrangement
                  </p>
                </div>
              </div>
              <Link
                to="/class-view"
                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Full Seating View</span>
                <span>→</span>
              </Link>
            </div>

            {loading ? (
              <div className="h-44 flex items-center justify-center text-slate-500 text-base">
                Loading today's seating matrix...
              </div>
            ) : isHoliday ? (
              <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-center font-medium text-base">
                🏖️ Today is a weekend or scheduled holiday. Rotation paused.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold px-1">
                  <span>Current Cycle: <strong className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">Day {currentDay || 1} of 24</strong></span>
                  <span>Active Rows: <strong className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">6 Rows Allocated</strong></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
                  {seatCodes.map((s, idx) => {
                    const isGirl = s.type === 'girl';
                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border text-center transition-all hover:scale-105 ${
                          isGirl
                            ? 'bg-pink-500/10 border-pink-500/25 text-pink-600 dark:text-pink-400 shadow-sm shadow-pink-500/5'
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5'
                        }`}
                      >
                        <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                          Row {s.row || idx + 1}
                        </div>
                        <div className="text-3xl sm:text-4xl font-black mt-1.5 mb-1 tracking-tight">
                          {s.code}
                        </div>
                        <div className="text-xs sm:text-sm font-bold opacity-85 truncate">
                          {isGirl ? 'Girls Group' : 'Boys Group'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Broadcast / Announcement & Tasks Card */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900/90 rounded-3xl p-7 sm:p-9 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 flex items-center justify-center font-bold text-2xl shadow-sm">
                📢
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Announcements
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Classroom Broadcasts</p>
              </div>
            </div>

            {rotationData?.announcement?.active && rotationData?.announcement?.text ? (
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-sm sm:text-base leading-relaxed font-medium">
                {rotationData.announcement.text}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                No active announcements right now. Admin updates will broadcast here in real time.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Student Tasks Hub</span>
            <Link to="/todo" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5">
              <span>Open Tasks</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* App Installation / Download Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
            📱
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Install CSE-5 Super App on Your Phone or Laptop
            </h3>
            <p className="text-emerald-50 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Access classroom seating rotation, real-time push alerts, offline RAG docs, and AI tools with a single tap on Android, iPhone, Windows, or Mac.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDownloadModal(true)}
          className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 font-extrabold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span>📥</span>
          <span>Download & Install App</span>
        </button>
      </div>

      {/* AI Capabilities Grid */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ⚡ AI Capabilities Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              One application. Multiple specialized AI intelligences and computational workflows.
            </p>
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            ● 9 Modules Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiCapabilities.map((cap, idx) => (
            <Link
              key={idx}
              to={cap.path}
              className="group p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
                    {cap.icon}
                  </div>
                  <StatusBadge status={cap.status} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors text-lg sm:text-xl">
                  {cap.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-sm font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                <span>Launch Studio</span>
                <span className="group-hover:translate-x-1.5 transition-transform text-base">→</span>
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
