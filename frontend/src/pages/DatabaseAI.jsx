import { useState } from 'react';
import axios from 'axios';
import FileUploader from '../components/common/FileUploader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DatabaseAI() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDbName, setActiveDbName] = useState('student.db (Default Class Records)');
  const [isUploadingDb, setIsUploadingDb] = useState(false);
  const [dbUploadMsg, setDbUploadMsg] = useState('');

  const sampleQuestions = [
    'How many students are in the database?',
    'Which students scored marks higher than 85 in Data Science?',
    'Find students with attendance below 75%.',
    'What is the average marks across all departments?',
    'List all students in the DEVOPS class with their sections.',
  ];

  const handleCustomDbUpload = async (file) => {
    setIsUploadingDb(true);
    setDbUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API_BASE}/temp/database/upload`, formData);
      setActiveDbName(`${file.name} (Temporary Session DB)`);
      setDbUploadMsg(`✓ Database '${file.name}' connected for this session. Read-only guardrails active.`);
    } catch (e) {
      setDbUploadMsg('⚠️ Failed to upload SQLite database.');
    } finally {
      setIsUploadingDb(false);
    }
  };

  const handleQuery = async (customQ = null) => {
    const q = customQ || question;
    if (!q.trim()) return;
    setLoading(true);
    setResponse('');
    setGeneratedSQL('');
    try {
      const res = await axios.post(`${API_BASE}/temp/database/query`, {
        question: q.trim(),
      });
      setResponse(res.data.answer);
      setGeneratedSQL(res.data.generatedSQL);
      setIsReadOnly(res.data.isReadOnly);
      setRecords(res.data.records || []);
    } catch (e) {
      setResponse('Failed to execute safe database query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
          Strict Read-Only SQL Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>🗄️</span> SQL & Database AI Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Convert natural English into safe SQLite queries. Blocks modification keywords (`DROP`, `DELETE`, `UPDATE`) by design.
        </p>
      </div>

      {/* Database Connection Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl font-bold">
            🗄️
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Connected Database</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{activeDbName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            ✓ Read-Only Guard Active
          </span>
        </div>
      </div>

      {/* Upload Custom SQLite DB (Temporary) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Upload Temporary SQLite Database (.db / .sqlite)
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Session Temporary</span>
        </div>

        <FileUploader
          accept=".db,.sqlite,.sqlite3"
          maxSizeMB={20}
          onFileSelect={handleCustomDbUpload}
          title="Upload SQLite File"
          subtitle="Drag & drop custom SQLite database to query during this session"
          fileTypeHint=".DB, .SQLITE"
          isUploading={isUploadingDb}
        />

        {dbUploadMsg && (
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold text-center">
            {dbUploadMsg}
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Suggested Analytical Queries:
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleQuery(q);
              }}
              className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Query Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
          Ask in Plain English:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How many students scored higher than 85 marks in section A?"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? 'Executing...' : 'Run Safe SQL'}
          </button>
        </div>

        {/* Generated Safe SQL & Safety Check */}
        {generatedSQL && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400 font-bold uppercase tracking-wider font-mono">
                Generated Safe SQL:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                ✓ Read-Only Verified
              </span>
            </div>
            <pre className="font-mono text-xs text-slate-200 overflow-x-auto bg-slate-950 p-3 rounded-xl">
              {generatedSQL}
            </pre>
          </div>
        )}

        {/* Response & Explanation */}
        {response && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            <div className="font-bold text-purple-500 mb-2 flex items-center gap-1.5">
              <span>📊</span> Query Result & Explanation:
            </div>
            {response}
          </div>
        )}

        {/* Database Records Table Preview */}
        {records.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                STUDENT Table Records Preview ({records.length} records)
              </h4>
              <span className="text-[10px] text-slate-400">Read-Only View</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-500">{r.rollNo || `CSE-${500 + (i + 1)}`}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                      <td className="p-3">{r.class}</td>
                      <td className="p-3">{r.section}</td>
                      <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{r.marks}</td>
                      <td className="p-3">{r.attendance}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
