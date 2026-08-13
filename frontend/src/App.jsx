import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StudentView from './pages/StudentView';
import AdminPanel from './pages/AdminPanel';
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

                <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-8">
                  <Routes>
                    <Route path="/" element={<StudentView />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/todo" element={<TodoLogin />} />
                    <Route path="/todo/dashboard" element={<TodoDashboard />} />
                    <Route path="/critical-admin" element={<CriticalAdminLogin />} />
                    <Route path="/critical-admin/dashboard" element={<CriticalAdminDashboard />} />
                  </Routes>
                </main>
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
