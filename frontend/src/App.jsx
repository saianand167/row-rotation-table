import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StudentView from './pages/StudentView';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  useEffect(() => {
    // Always enforce light mode — dark class never applied
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('rrt-dark-mode');
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20 text-gray-900">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/3 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Navbar />

          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-8">
            <Routes>
              <Route path="/" element={<StudentView />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
