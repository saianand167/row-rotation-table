import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VoiceAI() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const accumulatedRef = useRef('');

  // Speech Recognition (English EN-US / EN-IN)
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      accumulatedRef.current = '';
      setTranscript('');
      setInterimTranscript('');

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          accumulatedRef.current = (accumulatedRef.current + ' ' + currentFinal).replace(/\s+/g, ' ').trim();
          setTranscript(accumulatedRef.current);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Recognition error:', e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const fullSpoken = (accumulatedRef.current + ' ' + interimTranscript).trim();
    if (fullSpoken) {
      setTranscript(fullSpoken);
      handleSendToAI(fullSpoken);
    }
  };

  const handleSendToAI = async (textOverride = null) => {
    const queryText = textOverride || transcript || interimTranscript;
    if (!queryText.trim()) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
    setLoading(true);
    setAiResponse('');

    try {
      const res = await axios.post(`${API_BASE}/ai/chat`, {
        prompt: queryText.trim(),
      });

      const reply = res.data.answer || 'Response received.';
      setAiResponse(reply);
      speakText(reply);
    } catch (e) {
      setAiResponse('⚠️ Failed to get AI response. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const currentLiveText = (transcript + ' ' + interimTranscript).trim();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          Real-Time Neural Speech Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>🎙️</span> Voice & Audio AI Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time speech-to-text live stream. Speak your query and receive instant voice intelligence.
        </p>
      </div>

      {/* Voice Assistant Dark Panel (Matching User Interface Design) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRecording ? (
                <span className="text-rose-400">🟢 LIVE LISTENING (EN)... SPEAK NOW</span>
              ) : (
                <span className="text-slate-400">VOICE AI READY • ENGLISH MODEL</span>
              )}
            </span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
            Real-time Speech-to-Text
          </span>
        </div>

        {/* Animated Sound Waves Equalizer */}
        <div className="flex justify-center items-center gap-1.5 h-12 py-1">
          {isRecording ? (
            <>
              <span className="w-1.5 bg-cyan-400 rounded-full animate-wave-1" />
              <span className="w-1.5 bg-teal-400 rounded-full animate-wave-2" />
              <span className="w-1.5 bg-rose-500 rounded-full animate-wave-3" />
              <span className="w-1.5 bg-cyan-400 rounded-full animate-wave-4" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-5" />
              <span className="w-1.5 bg-rose-500 rounded-full animate-wave-2" />
              <span className="w-1.5 bg-teal-400 rounded-full animate-wave-4" />
            </>
          ) : (
            <div className="flex items-center gap-1 opacity-30">
              <span className="w-1.5 h-3 bg-slate-500 rounded-full" />
              <span className="w-1.5 h-4 bg-slate-500 rounded-full" />
              <span className="w-1.5 h-2 bg-slate-500 rounded-full" />
              <span className="w-1.5 h-5 bg-slate-500 rounded-full" />
              <span className="w-1.5 h-3 bg-slate-500 rounded-full" />
            </div>
          )}
        </div>

        {/* Big Interactive Recording Button */}
        <div className="flex justify-center items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-7 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/50 animate-pulse active:scale-95'
                : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-xl shadow-teal-500/25 hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? (
              <>
                <span className="text-lg">⏹️</span>
                <span className="text-sm font-black tracking-wide">Finish Speaking & Submit</span>
              </>
            ) : (
              <>
                <span className="text-lg animate-bounce">🎙️</span>
                <span className="text-sm font-black tracking-wide">Tap to Speak (Live Recognition)</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Streaming Live Text Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left min-h-[75px] flex flex-col justify-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1 flex items-center gap-1.5">
            <span>📈</span>
            <span>LIVE VOICE STREAM (PRINTING AS YOU TALK):</span>
          </div>
          <div className="text-sm font-mono text-slate-200">
            {currentLiveText ? (
              <span className="text-cyan-300">
                "{currentLiveText}"
                {isRecording && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
              </span>
            ) : (
              <span className="text-slate-500 italic text-xs">
                Start talking — your spoken words will appear here in real-time...
              </span>
            )}
          </div>
        </div>

        {/* Action Controls if text is available */}
        {currentLiveText && !isRecording && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setTranscript('');
                setInterimTranscript('');
                setAiResponse('');
              }}
              className="text-xs text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => handleSendToAI()}
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              {loading ? 'Processing...' : '🚀 Ask AI Assistant'}
            </button>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Generating AI Speech Response...</div>
        </div>
      )}

      {/* AI Response Output */}
      {aiResponse && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-bold text-teal-600 dark:text-teal-400 text-sm uppercase tracking-wider flex items-center gap-2">
              <span>🤖</span> AI Response:
            </div>
            <button
              onClick={() => speakText(aiResponse)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
              }`}
            >
              <span>{isSpeaking ? '⏹️ Stop Voice' : '🔊 Listen Voice'}</span>
            </button>
          </div>

          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
}
