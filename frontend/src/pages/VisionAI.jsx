import { useState } from 'react';
import axios from 'axios';
import FileUploader from '../components/common/FileUploader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VisionAI() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [loading, setLoading] = useState(false);

  const presetPrompts = [
    'What is present in this image? Explain thoroughly.',
    'Extract all readable text (OCR) into structured format.',
    'Explain this technical diagram or flowchart step by step.',
    'Identify any errors, inconsistencies, or missing elements.',
    'Summarize this document image into clean bullet points.',
  ];

  const handleImageSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAnalysis('');
  };

  const handleAnalyze = async (customPrompt = null) => {
    const p = customPrompt || prompt || 'Analyze this image and explain what is shown.';
    if (!imageFile && !imagePreview) return;
    setLoading(true);
    setAnalysis('');
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('imageBase64', imagePreview);
      }
      formData.append('prompt', p);

      const res = await axios.post(`${API_BASE}/temp/vision/analyze`, formData);
      setAnalysis(res.data.analysis);
      setModelUsed(res.data.model || 'Vision AI Model');
    } catch (e) {
      setAnalysis('⚠️ Failed to analyze image. Please ensure your image is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          Multimodal Perception Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>🖼️</span> Multimodal Vision AI Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload screenshots, diagrams, flowcharts, classroom notes, or photos. Understand visual concepts with neural reasoning.
        </p>
      </div>

      {/* Image Upload Area */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Upload Image for Multimodal Analysis
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Temporary Session File</span>
        </div>

        <FileUploader
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          maxSizeMB={15}
          onFileSelect={handleImageSelect}
          title="Upload Diagram or Image"
          subtitle="PNG, JPEG, WebP diagrams, photos, or screenshots"
          fileTypeHint="Images"
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center">
            <img
              src={imagePreview}
              alt="Uploaded Preview"
              className="max-h-72 rounded-2xl object-contain shadow-md border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
                setAnalysis('');
              }}
              className="mt-3 text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Remove Image
            </button>
          </div>
        )}
      </div>

      {/* Preset Prompts */}
      {imagePreview && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Vision Queries:
          </div>
          <div className="flex flex-wrap gap-2">
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleAnalyze(p);
                }}
                className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Box */}
      {imagePreview && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
            Ask Questions About This Image:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Explain the components in this flowchart..."
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>

          {/* Analysis Result */}
          {analysis && (
            <div className="mt-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <span>💡</span> Vision Reasoning Output:
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Model: {modelUsed}
                </span>
              </div>
              {analysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
