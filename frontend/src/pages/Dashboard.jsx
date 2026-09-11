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

  // Quick Action Services for BHIM-style 4-column / 2-column mobile grid
  const quickActions = [
    { title: 'AI Chat', subtitle: 'Assistant', icon: '🤖', path: '/ai-chat' },
    { title: 'Rotation', subtitle: 'Class Seating', icon: '🪑', path: '/class-view' },
    { title: 'Tasks', subtitle: 'Todo List', icon: '✅', path: '/todo' },
    { title: 'Doc RAG', subtitle: 'Knowledge', icon: '📄', path: '/rag' },
    { title: 'Vision AI', subtitle: 'Multimodal', icon: '🖼️', path: '/vision-ai' },
    { title: 'SQL AI', subtitle: 'Safe Queries', icon: '🗄️', path: '/database-ai' },
    { title: 'Voice AI', subtitle: 'Speech/Audio', icon: '🎙️', path: '/voice-ai' },
    { title: 'Video AI', subtitle: 'Lecture Sums', icon: '🎥', path: '/video-ai' },
  ];

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
    <div className="space-y-5 sm:space-y-7 lg:space-y-10 animate-fade-in w-full max-w-full box-border">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border border-slate-800/80 p-5 sm:p-10 lg:p-14 shadow-2xl max-w-full box-border">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
          <div className="space-y-2.5 sm:space-y-4 max-w-4xl min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate">CSE-5 Unified AI Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight break-words">
              Generative AI Super App
            </h1>
            <p className="text-slate-300 text-xs sm:text-lg lg:text-xl leading-relaxed">
              Your unified workspace for classroom seating automation, permanent knowledge RAG, safe SQL analytics, multi-modal vision, and specialized intelligence agents.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
            <Link
              to="/ai-chat"
              className="w-full sm:w-auto px-5 lg:px-7 py-3 lg:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span className="text-xl">🤖</span>
              <span>Launch AI Assistant</span>
            </Link>
            <Link
              to="/class-view"
              className="w-full sm:w-auto px-5 lg:px-7 py-3 lg:py-4 rounded-2xl bg-slate-800/95 hover:bg-slate-700 text-white font-extrabold text-sm sm:text-base border border-slate-700/80 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
            >
              <span className="text-xl">🪑</span>
              <span>Row Rotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* BHIM-Style Quick Action Services Card (4-column grid on normal phones, 2-column fallback on narrow screens) */}
      <div className="w-full max-w-full bg-white dark:bg-slate-900/90 rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl box-border">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-base sm:text-xl shadow-sm">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Quick Actions & Services
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Direct shortcuts to classroom and AI tools
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
            8 Shortcuts
          </span>
        </div>

        {/* 4-column grid on >= 380px, 2-column on narrow screens (320px-375px) */}
        <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2.5 sm:gap-4 w-full box-border">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.path}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-500/40 transition-all text-center group min-w-0 max-w-full box-border active:scale-95 shadow-sm"
            >
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-1.5 sm:mb-2 shrink-0">
                {action.icon}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors truncate w-full text-center">
                {action.title}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium truncate w-full text-center mt-0.5">
                {action.subtitle}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Row Rotation Seating & Announcements Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-7 lg:gap-8 w-full max-w-full box-border">
        {/* Today's Rotation Seating Preview */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900/90 rounded-3xl p-4 sm:p-7 lg:p-9 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex flex-col justify-between max-w-full box-border">
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
                  🪑
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    Today's Row Rotation
                  </h2>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    24-Day Deterministic Seating Layout
                  </p>
                </div>
              </div>
              <Link
                to="/class-view"
                className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Full View</span>
                <span>→</span>
              </Link>
            </div>

            {loading ? (
              <div className="h-36 sm:h-44 flex items-center justify-center text-slate-500 text-sm sm:text-base">
                Loading today's seating matrix...
              </div>
            ) : isHoliday ? (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-center font-medium text-sm sm:text-base">
                🏖️ Today is a weekend or scheduled holiday. Rotation paused.
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold px-1">
                  <span>Cycle: <strong className="text-slate-900 dark:text-white font-bold">Day {currentDay || 1} of 24</strong></span>
                  <span>Allocation: <strong className="text-slate-900 dark:text-white font-bold">6 Active Rows</strong></span>
                </div>

                <div className="grid grid-cols-2 min-[440px]:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4 w-full box-border">
                  {seatCodes.map((s, idx) => {
                    const isGirl = s.type === 'girl';
                    return (
                      <div
                        key={idx}
                        className={`p-3 sm:p-4 rounded-2xl border text-center transition-all hover:scale-105 min-w-0 max-w-full box-border ${
                          isGirl
                            ? 'bg-pink-500/10 border-pink-500/25 text-pink-600 dark:text-pink-400 shadow-sm shadow-pink-500/5'
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider opacity-75">
                          Row {s.row || idx + 1}
                        </div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1 mb-0.5 tracking-tight truncate">
                          {s.code}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold opacity-85 truncate">
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
        <div className="xl:col-span-4 bg-white dark:bg-slate-900/90 rounded-3xl p-4 sm:p-7 lg:p-9 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex flex-col justify-between space-y-5 max-w-full box-border">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3.5 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
                📢
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  Announcements
                </h2>
                <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400">Classroom Broadcasts</p>
              </div>
            </div>

            {rotationData?.announcement?.active && rotationData?.announcement?.text ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm md:text-base leading-relaxed font-medium break-words">
                {rotationData.announcement.text}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                No active announcements right now. Admin updates will broadcast here in real time.
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Student Tasks Hub</span>
            <Link to="/todo" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
              <span>Open Tasks</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* App Installation / Download Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 max-w-full box-border">
        <div className="flex items-center gap-3.5 text-center md:text-left flex-col md:flex-row min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
            📱
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg sm:text-2xl font-black tracking-tight break-words">
              Install CSE-5 Super App on Your Phone or Laptop
            </h3>
            <p className="text-emerald-50 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Access classroom seating rotation, real-time push alerts, offline RAG docs, and AI tools with a single tap on Android, iPhone, Windows, or Mac.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDownloadModal(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 font-extrabold text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>📥</span>
          <span>Download & Install App</span>
        </button>
      </div>

      {/* AI Capabilities Large Module Cards Section */}
      <div className="space-y-5 sm:space-y-6 pt-2 max-w-full box-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              ⚡ AI Capabilities Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              One application. Multiple specialized AI intelligences and computational workflows.
            </p>
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full shrink-0">
            ● 9 Modules Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-full box-border">
          {aiCapabilities.map((cap, idx) => (
            <Link
              key={idx}
              to={cap.path}
              className="group p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 max-w-full box-border"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all shrink-0">
                    {cap.icon}
                  </div>
                  <StatusBadge status={cap.status} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors text-base sm:text-xl truncate">
                  {cap.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                <span>Launch Studio</span>
                <span className="group-hover:translate-x-1.5 transition-transform text-sm sm:text-base">→</span>
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
