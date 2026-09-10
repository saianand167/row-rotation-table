import { useState, useEffect } from 'react';
import axios from 'axios';
import FileUploader from '../components/common/FileUploader';
import DuplicateModal from '../components/common/DuplicateModal';
import { EmptyState } from '../components/common/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  'All',
  'General',
  'Data Structures',
  'Operating Systems',
  'AI & ML',
  'DBMS',
  'Web Technologies',
  'Cheatsheets & Formulas',
  'Personal Notes',
];

export default function DocumentRAG() {
  const [activeTab, setActiveTab] = useState('docs');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadMsg, setUploadMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New Note Creation State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('AI & ML');
  const [noteTags, setNoteTags] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Duplicate Document Modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [existingDuplicateDoc, setExistingDuplicateDoc] = useState(null);

  // Expanded Citation Index
  const [expandedCitation, setExpandedCitation] = useState(null);

  const fetchDocs = async () => {
    try {
      const url = `${API_BASE}/documents/list?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`;
      const res = await axios.get(url);
      setDocs(res.data.docs || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDocs();
  }, [searchQuery, selectedCategory]);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);

      const res = await axios.post(`${API_BASE}/documents/upload`, formData);

      // Check if backend detected identical SHA-256 content
      if (res.data.isDuplicate) {
        setExistingDuplicateDoc(res.data.existingDoc);
        setDuplicateModalOpen(true);
        setUploadMsg('ℹ️ Duplicate document detected. Preserved existing record.');
      } else {
        setUploadMsg(`✓ ${res.data.message}`);
        fetchDocs();
        setActiveTab('docs');
      }
    } catch (err) {
      setUploadMsg(`⚠️ ${err.response?.data?.error || 'Failed to upload document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      setNoteMsg('⚠️ Please provide both Note Title and Content.');
      return;
    }

    setIsSavingNote(true);
    setNoteMsg('');
    try {
      const res = await axios.post(`${API_BASE}/documents/note`, {
        title: noteTitle.trim(),
        category: noteCategory,
        tags: noteTags,
        content: noteContent.trim(),
        author: noteAuthor.trim() || 'CSE-5 Student',
      });

      if (res.data.isDuplicate) {
        setNoteMsg(`ℹ️ Note already exists: ${res.data.existingDoc.filename}`);
      } else {
        setNoteMsg('✓ Study Note saved and permanently indexed!');
        setNoteTitle('');
        setNoteContent('');
        setNoteTags('');
        fetchDocs();
        setTimeout(() => setActiveTab('docs'), 800);
      }
    } catch (err) {
      setNoteMsg(`⚠️ ${err.response?.data?.error || 'Failed to save note'}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewContent('');
    try {
      const res = await axios.get(`${API_BASE}/documents/${doc.id}/content`);
      setPreviewContent(res.data.content || 'No text preview available.');
    } catch (e) {
      setPreviewContent('Failed to load document content.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Are you sure you want to remove this document/note from the Knowledge Base?')) return;
    try {
      await axios.delete(`${API_BASE}/documents/${id}`);
      fetchDocs();
    } catch (e) {
      alert('Failed to delete document');
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    setCitations([]);
    try {
      const res = await axios.post(`${API_BASE}/documents/query`, {
        question: question.trim(),
      });
      setAnswer(res.data.answer);
      setCitations(res.data.citations || []);
    } catch (e) {
      setAnswer('Failed to retrieve answer from Knowledge Base.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          Permanent Knowledge Base & Notes Hub
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>📚</span> Study Notes & Document AI RAG
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload classroom notes, course PDFs, PPTX, or write custom study notes. Everything is permanently indexed into vector storage with SHA-256 deduplication.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'docs', label: `📚 Library & Notes (${docs.length})`, icon: '📖' },
          { id: 'write_note', label: '📝 New Study Note', icon: '✍️' },
          { id: 'upload', label: '📤 Upload File', icon: '☁️' },
          { id: 'chat', label: '💬 Contextual RAG Q&A', icon: '🤖' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Documents & Notes Library */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indexed notes & documents by title..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('write_note')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📝</span> + Write Note
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📤</span> + Upload File
              </button>
            </div>
          </div>

          {docs.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No Study Notes or Documents Found"
              description="Upload course lecture notes, PDFs, or write new notes to organize your study repository."
              actionText="+ Write First Note"
              onAction={() => setActiveTab('write_note')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-500/50 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{doc.isNote ? '📝' : '📄'}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          {doc.category || 'General'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        Indexed
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2 line-clamp-2" title={doc.filename}>
                      {doc.filename.replace('.note.md', '')}
                    </h4>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {doc.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                      <div>Size: {(doc.sizeBytes / 1024).toFixed(1)} KB • {doc.pageCount || 1} {doc.isNote ? 'sections' : 'pages'}</div>
                      <div>Uploaded By: <span className="font-medium text-slate-600 dark:text-slate-300">{doc.uploadedBy || 'Student'}</span></div>
                      <div>Date: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenPreview(doc)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1"
                    >
                      <span>👁️</span> Read
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setQuestion(`Explain key concepts from ${doc.filename.replace('.note.md', '')}`);
                          setActiveTab('chat');
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        🤖 Ask AI
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-400 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: New Study Note Creation */}
      {activeTab === 'write_note' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <span>📝</span> Create & Save Study Note
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Write or paste classroom lecture notes, interview cheatsheets, or topic summaries. Notes are indexed immediately for contextual AI Q&A.
            </p>
          </div>

          <form onSubmit={handleCreateNote} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Note Title / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. B-Trees & Indexing in DBMS, or Process Synchronization"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Category
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="e.g. algorithms, trees, exam-prep"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Author / Student Name
                </label>
                <input
                  type="text"
                  value={noteAuthor}
                  onChange={(e) => setNoteAuthor(e.target.value)}
                  placeholder="e.g. Sai Manikanta (or leave empty)"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Note Content (Markdown supported) *
              </label>
              <textarea
                required
                rows={10}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write or paste your complete study notes here...&#10;&#10;## Key Concept 1&#10;- Explanation point&#10;- Formulas & definitions"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {noteMsg && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center ${
                noteMsg.startsWith('✓')
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {noteMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingNote || !noteTitle.trim() || !noteContent.trim()}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>💾</span> {isSavingNote ? 'Indexing Note...' : 'Save & Index Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Upload Documents */}
      {activeTab === 'upload' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ingest Document into Permanent Knowledge Base
              </h3>
              <p className="text-xs text-slate-400">PDF, DOCX, PPTX, XLSX, TXT supported with SHA-256 deduplication</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <FileUploader
            accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md"
            maxSizeMB={35}
            onFileSelect={handleFileUpload}
            title="Upload Document"
            subtitle="Drag & drop course PDF, DOCX, PPTX, or text files to index permanently"
            fileTypeHint="PDF, DOCX, PPTX, XLSX, TXT, MD"
            isUploading={isUploading}
          />

          {uploadMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold text-center ${
              uploadMsg.startsWith('✓')
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}>
              {uploadMsg}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Contextual RAG Q&A */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Contextual Knowledge Base Q&A
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Answers are grounded strictly on retrieved excerpts from your indexed notes & documents with clean verified citations.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="Ask anything about your study notes (e.g. 'Explain key concepts from ORCA architecture')..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleQuery}
                disabled={loading || !question.trim()}
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer"
              >
                {loading ? 'Retrieving...' : 'Ask RAG'}
              </button>
            </div>

            {answer && (
              <div className="mt-4 p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                <div className="font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <span>💡</span> Grounded Knowledge Answer:
                </div>
                
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {answer}
                </div>

                {/* Clean, Polished Citations */}
                {citations.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📄</span> Verified Source Citations ({citations.length}):
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {citations.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs transition-all hover:border-blue-500/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[200px]" title={c.filename}>
                              📄 {c.filename}
                            </div>
                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                              Page {c.pageNumber}
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1.5 text-[11px] line-clamp-2 leading-tight">
                            "{c.snippet}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note / Document Full Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{previewDoc.isNote ? '📝' : '📄'}</span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-md">
                    {previewDoc.filename.replace('.note.md', '')}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
                      {previewDoc.category || 'General'}
                    </span>
                    <span>Uploaded by {previewDoc.uploadedBy || 'Student'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
              {previewLoading ? (
                <div className="text-center py-12 text-slate-400">Loading document content...</div>
              ) : (
                previewContent
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setQuestion(`Explain key concepts from ${previewDoc.filename.replace('.note.md', '')}`);
                  setPreviewDoc(null);
                  setActiveTab('chat');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                🤖 Ask AI About This Note
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Document Modal */}
      <DuplicateModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        existingDoc={existingDuplicateDoc}
        onAskAI={(doc) => {
          setQuestion(`Explain key concepts from ${doc.filename}`);
          setActiveTab('chat');
        }}
        onOpenExisting={() => setActiveTab('docs')}
      />
    </div>
  );
}
