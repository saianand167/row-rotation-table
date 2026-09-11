import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Welcome to the **CSE-5 AI Assistant**! I am your central intelligence layer.\n\nI can coordinate across your **Row Rotation (RRT)**, **Knowledge Base RAG**, **SQL Databases**, **CSV Datasets**, **Vision Images**, **YouTube Lectures**, and **ORCA Marine & Healthcare** telemetry.\n\nHow can I help you today?',
      toolName: 'AI Orchestrator',
      toolIcon: '🤖',
      steps: [],
      citations: [],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Start AI session
  useEffect(() => {
    axios.post(`${API_BASE}/temp/session/start`, { sessionId }).catch(() => {});
    return () => {
      // Cleanup temporary session files when leaving
      axios.post(`${API_BASE}/temp/session/end`, { sessionId }).catch(() => {});
    };
  }, [sessionId]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputPrompt;
    if ((!textToSend.trim() && !attachedFile) || loading) return;

    const userMsg = {
      role: 'user',
      content: textToSend,
      attachment: attachedFile ? { name: attachedFile.name, type: attachedFile.type } : null,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputPrompt('');
    setLoading(true);

    try {
      let response;

      // If user uploaded an image in chat, route to Vision AI
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        const formData = new FormData();
        formData.append('image', attachedFile);
        formData.append('prompt', textToSend || 'What is shown in this image? Explain in detail.');
        formData.append('sessionId', sessionId);

        const vRes = await axios.post(`${API_BASE}/temp/vision/analyze`, formData);
        response = {
          data: {
            answer: vRes.data.analysis,
            toolName: 'Vision AI',
            toolIcon: '🖼️',
            steps: [
              {
                name: 'Multimodal Vision Engine',
                source: vRes.data.model,
                query: textToSend || 'Image Analysis',
                output: 'Decoded visual elements, diagram structures, and extracted text.',
              }
            ]
          }
        };
      }
      // If user uploaded a CSV in chat
      else if (attachedFile && (attachedFile.name.endsWith('.csv') || attachedFile.type.includes('csv'))) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        formData.append('sessionId', sessionId);

        const cRes = await axios.post(`${API_BASE}/temp/csv/upload`, formData);
        const profile = cRes.data.profile;
        const qRes = await axios.post(`${API_BASE}/temp/csv/query`, {
          sessionId,
          question: textToSend || 'Provide a summary and key statistics of this dataset.',
          customProfile: profile,
        });

        response = {
          data: {
            answer: qRes.data.answer,
            toolName: 'CSV Data Analytics',
            toolIcon: '📊',
            steps: [
              {
                name: 'Dataset Profiler',
                source: attachedFile.name,
                query: textToSend || 'Dataset Overview',
                output: `Profiled ${profile.rowCount} rows & ${profile.colCount} columns.`,
              }
            ]
          }
        };
      }
      // Regular Multi-Tool Orchestrated Query
      else {
        response = await axios.post(`${API_BASE}/ai/chat`, {
          prompt: textToSend,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId,
        });
      }

      const { answer, toolName, toolIcon, steps, metadata } = response.data;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer || 'I have completed processing your request.',
          toolName: toolName || 'AI Assistant',
          toolIcon: toolIcon || '🤖',
          steps: steps || [],
          citations: metadata?.citations || [],
        },
      ]);
      setAttachedFile(null);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to get AI response: ${err.response?.data?.error || err.message}. Please check your backend connection.`,
          toolName: 'System Error',
          toolIcon: '⚠️',
          steps: [],
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech-to-Text handler with live streaming & editable text
  const [liveStreamVoice, setLiveStreamVoice] = useState('');
  const recRef = useRef(null);
  const isListeningRef = useRef(false);
  const accumulatedSpeechRef = useRef('');

  const startVoiceInput = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      }
    } catch (e) {}

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;

      accumulatedSpeechRef.current = inputPrompt.trim();
      setLiveStreamVoice('');

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (e) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const item = e.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + ' ';
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + finalChunk).replace(/\s+/g, ' ').trim();
        }

        const fullSpoken = (accumulatedSpeechRef.current + ' ' + interimChunk).replace(/\s+/g, ' ').trim();
        setLiveStreamVoice(fullSpoken);
        setInputPrompt(fullSpoken);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.start();
      recRef.current = recognition;
    } catch (e) {
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const stopVoiceInput = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }

    const fullText = (accumulatedSpeechRef.current + ' ' + liveStreamVoice).replace(/\s+/g, ' ').trim() || inputPrompt.trim();
    if (fullText) {
      setInputPrompt(fullText);
    }
    setLiveStreamVoice('');
  };

  const stopVoiceInputAndSend = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }

    const textToSend = (accumulatedSpeechRef.current + ' ' + liveStreamVoice).replace(/\s+/g, ' ').trim() || inputPrompt.trim();
    if (textToSend) {
      handleSendMessage(textToSend);
      setLiveStreamVoice('');
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  // Text to Speech playback
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#`_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLanguage;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl xl:max-w-6xl w-full mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-500/20">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              AI Super Assistant
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Intelligent Multi-Tool Router • Intent Auto-Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector for STT */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="en-US">🇺🇸 English</option>
            <option value="hi-IN">🇮🇳 Hindi (हिन्दी)</option>
            <option value="te-IN">🇮🇳 Telugu (తెలుగు)</option>
          </select>

          <button
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  content: 'Chat session reset. What would you like to explore?',
                  toolName: 'AI Orchestrator',
                  toolIcon: '🤖',
                  steps: [],
                  citations: [],
                },
              ])
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-1 no-scrollbar">
        {[
          { label: '🪑 Today\'s Rotation?', text: 'What is today\'s row rotation seating arrangement?' },
          { label: '📄 Search Knowledge Base', text: 'Based on my uploaded notes, explain normalization.' },
          { label: '🗄️ Query Students DB', text: 'How many students in the database scored marks higher than 85?' },
          { label: '🌊 Check Marine Safety', text: 'What is the current ORCA marine risk level and wave state for Vizag?' },
          { label: '🌐 Latest AI News', text: 'Search the web for the latest updates on multimodal LLMs.' },
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.text)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md shadow-emerald-500/20">
                  {msg.toolIcon || 'AI'}
                </div>
              )}

              <div className="max-w-[85%] space-y-2">
                {/* Active Tool Dispatch Pill */}
                {!isUser && msg.toolName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span>{msg.toolIcon}</span>
                    <span>Using: {msg.toolName}</span>
                  </div>
                )}

                {/* Expandable Tool Execution Cards */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {msg.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <span>✓</span>
                          <span>{step.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-auto">
                            {step.source}
                          </span>
                        </div>
                        {step.query && (
                          <div className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-[11px]">
                            Query: {step.query}
                          </div>
                        )}
                        {step.output && (
                          <div className="mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed overflow-x-auto max-w-full font-mono">
                            {step.output}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Attachment badge if uploaded by user */}
                {isUser && msg.attachment && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-700/30 text-white text-xs font-mono mb-1 max-w-full truncate">
                    <span>📎</span> <span className="truncate">{msg.attachment.name}</span>
                  </div>
                )}

                {/* Main Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words max-w-full overflow-hidden ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-tr-none shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/90 dark:border-slate-800/90 shadow-xs'
                  }`}
                >
                  {msg.content}

                  {/* Citations list if present */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                        📚 Knowledge Base Sources:
                      </div>
                      {msg.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-xs text-slate-700 dark:text-slate-300 break-words"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            [{c.filename} • Page {c.pageNumber}]
                          </span>{' '}
                          <span className="text-slate-500">{c.snippet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Text-to-Speech Listen Button for Assistant */}
                {!isUser && (
                  <button
                    onClick={() => speakText(msg.content)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer self-start"
                  >
                    <span>{isSpeaking ? '🔇 Stop Audio' : '🔊 Listen'}</span>
                  </button>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  U
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm font-bold animate-pulse">
              🤖
            </div>
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none flex items-center gap-2 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-slate-500 font-medium">Selecting tool & reasoning...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Chip */}
      {attachedFile && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 max-w-full">
          <span>📎</span>
          <span className="font-bold truncate">{attachedFile.name}</span>
          <span className="text-[10px] text-slate-400 shrink-0">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
          <button
            onClick={() => setAttachedFile(null)}
            className="ml-auto p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Voice Stream Equalizer Card when listening */}
      {isListening && (
        <div className="p-4 mb-2 rounded-2xl bg-slate-900 border border-teal-500/30 text-white shadow-xl space-y-3 animate-slide-down">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-400">
                🟢 LIVE LISTENING ({selectedLanguage.toUpperCase()})... SPEAK FREELY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopVoiceInput}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all border border-cyan-500/30 cursor-pointer"
                title="Stop recording and keep text in the input box so you can edit before sending"
              >
                ⏹️ Stop & Edit
              </button>
              <button
                type="button"
                onClick={stopVoiceInputAndSend}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Send transcription immediately to LLM"
              >
                🚀 Send Now
              </button>
            </div>
          </div>

          {/* Sound waves equalizer */}
          <div className="flex justify-center items-center gap-1.5 h-8 py-1">
            <span className="w-1.5 bg-cyan-400 rounded-full animate-wave-1" />
            <span className="w-1.5 bg-teal-400 rounded-full animate-wave-2" />
            <span className="w-1.5 bg-rose-500 rounded-full animate-wave-3" />
            <span className="w-1.5 bg-cyan-400 rounded-full animate-wave-4" />
            <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-5" />
            <span className="w-1.5 bg-rose-500 rounded-full animate-wave-2" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 min-h-[40px] flex items-center break-all">
            {liveStreamVoice || inputPrompt ? (
              <span>
                "{liveStreamVoice || inputPrompt}"
                <span className="inline-block w-2 h-3.5 bg-cyan-400 ml-1 animate-pulse" />
              </span>
            ) : (
              <span className="text-slate-500 italic">
                Listening... Your spoken words will appear here in real-time...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Multi-Attachment & Input Bar (Sticky above bottom nav on mobile) */}
      <div className="pt-2 sticky bottom-18 lg:bottom-0 z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          {/* File Attachment Input Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.csv,.pdf,.txt,.db"
            onChange={(e) => e.target.files?.[0] && setAttachedFile(e.target.files[0])}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Attach Document, Image, CSV, or Database"
          >
            📎
          </button>

          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={`Speech to Text (${selectedLanguage})`}
          >
            🎤
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything (seating, sql, vision, RAG)..."
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none min-w-0"
          />

          <button
            type="submit"
            disabled={(!inputPrompt.trim() && !attachedFile) || loading}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
