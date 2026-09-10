import { useState } from 'react';
import axios from 'axios';
import FileUploader from '../components/common/FileUploader';
import { EmptyState } from '../components/common/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DataAnalytics() {
  const [profile, setProfile] = useState(null);
  const [filename, setFilename] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const sampleCsvData = `Student,Class,Section,Marks,Attendance,LabScore
Krish Sharma,Data Science,A,90,95,92
John Doe,Data Science,B,100,98,96
Mukesh Patel,Data Science,A,86,88,85
Jacob Miller,DEVOPS,A,50,75,60
Dipesh Kumar,DEVOPS,A,35,62,45
Priya Reddy,AI & ML,A,94,96,98
Rahul Verma,AI & ML,B,82,89,84
Sneha Gupta,Cyber Security,A,88,92,90
Anil Rao,Cyber Security,B,76,84,78
Divya Iyer,DEVOPS,B,68,80,72`;

  const handleUploadCSV = async (file) => {
    setIsUploading(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API_BASE}/temp/csv/upload`, formData);
      setProfile(res.data.profile);
      setFilename(res.data.filename);
      setAnswer(res.data.initialAnalysis);
      setUploadMsg(`✓ Dataset '${res.data.filename}' loaded and profiled successfully!`);
    } catch (e) {
      setUploadMsg('⚠️ Failed to parse and profile CSV dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsUploading(true);
    try {
      const res = await axios.post(`${API_BASE}/temp/csv/upload`, {
        csvText: sampleCsvData,
        filename: 'cse5_students_sample.csv',
      });
      setProfile(res.data.profile);
      setFilename('cse5_students_sample.csv');
      setAnswer(res.data.initialAnalysis);
      setUploadMsg('✓ Sample dataset loaded successfully!');
    } catch (e) {
      setUploadMsg('⚠️ Failed to load sample dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (customQ = null) => {
    const q = customQ || question;
    if (!q.trim() || !profile) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await axios.post(`${API_BASE}/temp/csv/query`, {
        question: q.trim(),
        customProfile: profile,
      });
      setAnswer(res.data.answer);
    } catch (e) {
      setAnswer('Failed to analyze dataset query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          Temporary Session Dataset
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>📊</span> CSV Data Analytics & Profiling
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload spreadsheets for instant statistical profiling, column distributions, and conversational data science insights.
        </p>
      </div>

      {/* Upload or Load Sample Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Upload Dataset (.csv)
            </h3>
            <p className="text-xs text-slate-400">
              Files are processed as temporary session data and cleared when session terminates.
            </p>
          </div>
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer"
          >
            📊 Load Sample Student Dataset
          </button>
        </div>

        <FileUploader
          accept=".csv,.txt"
          maxSizeMB={25}
          onFileSelect={handleUploadCSV}
          title="Upload CSV File"
          subtitle="Drag & drop CSV file to profile and analyze"
          fileTypeHint=".CSV Spreadsheets"
          isUploading={isUploading}
        />

        {uploadMsg && (
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold text-center border border-amber-500/20">
            {uploadMsg}
          </div>
        )}
      </div>

      {/* Profile Metrics Overview */}
      {profile && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dataset Overview</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                  📁 {filename}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                ✓ Profiled
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Total Rows</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{profile.rowCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Columns</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{profile.colCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Missing Values</div>
                <div className="text-2xl font-black text-amber-500 mt-0.5">{profile.missingValuesCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Duplicate Rows</div>
                <div className="text-2xl font-black text-emerald-500 mt-0.5">{profile.duplicateCount}</div>
              </div>
            </div>

            {/* Column Summary Cards */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Column Distributions & Types:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.columnStats.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{col.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        col.type === 'Numeric' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      }`}>
                        {col.type}
                      </span>
                    </div>
                    {col.isNumeric ? (
                      <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                        <span>Min: {col.min}</span>
                        <span>Max: {col.max}</span>
                        <span>Mean: {col.mean}</span>
                        <span>Median: {col.median}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 pt-1">
                        Top Categories: {col.topCategories?.map(c => `${c.name} (${c.count})`).join(', ') || 'N/A'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive AI Data Q&A */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Ask Questions About This Dataset
            </h3>

            {/* Suggested Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                'What is the average marks and attendance?',
                'Which department has the highest performance?',
                'Are there any performance outliers?',
                'Find correlation between attendance and marks.',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleQuery(q);
                  }}
                  className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any statistical or analytical question..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleQuery()}
                disabled={loading || !question.trim()}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {answer && (
              <div className="mt-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                <div className="font-bold text-amber-500 mb-2 flex items-center gap-1.5">
                  <span>💡</span> Statistical Report & Insights:
                </div>
                {answer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
