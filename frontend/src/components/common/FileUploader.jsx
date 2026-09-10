import { useState, useRef } from 'react';

export default function FileUploader({
  accept = '*/*',
  maxSizeMB = 25,
  onFileSelect,
  title = 'Upload File',
  subtitle = 'Drag & drop your file here or browse',
  isUploading = false,
  uploadProgress = 0,
  fileTypeHint = '',
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file) => {
    setError('');
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const getFileIcon = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'csv' || ext === 'xlsx') return '📊';
    if (ext === 'db' || ext === 'sqlite') return '🗄️';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return '🖼️';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return '🎙️';
    return '📁';
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-2xl">
            {selectedFile ? getFileIcon(selectedFile.name) : '📤'}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedFile ? selectedFile.name : title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload`
                : subtitle}
            </p>
          </div>

          {fileTypeHint && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {fileTypeHint} • Max {maxSizeMB}MB
            </span>
          )}
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress || 65}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Processing file...</span>
              <span>{uploadProgress || 65}%</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
