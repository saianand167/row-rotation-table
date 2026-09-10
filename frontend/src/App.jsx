import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import StudentView from './pages/StudentView';
import AdminPanel from './pages/AdminPanel';
import DocumentRAG from './pages/DocumentRAG';
import VideoAI from './pages/VideoAI';
import VoiceAI from './pages/VoiceAI';
import DatabaseAI from './pages/DatabaseAI';
import DataAnalytics from './pages/DataAnalytics';
import OrcaMarine from './pages/OrcaMarine';
import HealthcareAI from './pages/HealthcareAI';
import VisionAI from './pages/VisionAI';
import Settings from './pages/Settings';
import TodoLogin from './pages/TodoLogin';
import TodoDashboard from './pages/TodoDashboard';
import CriticalAdminLogin from './pages/CriticalAdminLogin';
import CriticalAdminDashboard from './pages/CriticalAdminDashboard';
import { AppProvider } from './context/AppContext';
import { TodoProvider } from './context/TodoContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/todo/Toast';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <TodoProvider>
          <BrowserRouter>
            <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-600">
              {/* Background decorations */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl" />
                <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/3 blur-3xl" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <Navbar />

                <main className="w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-26 pb-16">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/ai-chat" element={<AIAssistant />} />
                    <Route path="/class-view" element={<StudentView />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/rag" element={<DocumentRAG />} />
                    <Route path="/documents" element={<DocumentRAG />} />
                    <Route path="/vision-ai" element={<VisionAI />} />
                    <Route path="/video-ai" element={<VideoAI />} />
                    <Route path="/voice-ai" element={<VoiceAI />} />
                    <Route path="/database-ai" element={<DatabaseAI />} />
                    <Route path="/data-analytics" element={<DataAnalytics />} />
                    <Route path="/orca" element={<OrcaMarine />} />
                    <Route path="/healthcare" element={<HealthcareAI />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/todo" element={<TodoLogin />} />
                    <Route path="/todo/dashboard" element={<TodoDashboard />} />
                    <Route path="/critical-admin" element={<CriticalAdminLogin />} />
                    <Route path="/critical-admin/dashboard" element={<CriticalAdminDashboard />} />
                  </Routes>
                </main>

                {/* Global Footer */}
                <footer className="mt-14 pb-10 text-center text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800/70 pt-6">
                  <div className="flex items-center justify-center gap-1.5 font-medium text-sm">
                    <span>Made with</span>
                    <span className="text-rose-500 animate-pulse text-base inline-block">❤️</span>
                    <span>for CSE</span>
                  </div>
                </footer>
              </div>

              {/* Toast Notifications */}
              <ToastContainer />
            </div>
          </BrowserRouter>
        </TodoProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
