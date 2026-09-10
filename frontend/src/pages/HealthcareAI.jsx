import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HealthcareAI() {
  const [inputText, setInputText] = useState('');
  const [transcriptInterim, setTranscriptInterim] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState('');
  const [micStatusMsg, setMicStatusMsg] = useState('');

  const recognitionRef = useRef(null);
  const accumulatedRef = useRef('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicStatusMsg('⚠️ Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    setMicStatusMsg('');
    setAssessment('');

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      accumulatedRef.current = inputText ? inputText + ' ' : '';
      setTranscriptInterim('');

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + ' ';
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedRef.current = (accumulatedRef.current + finalChunk).replace(/\s+/g, ' ').trim() + ' ';
        }

        const fullSpokenText = (accumulatedRef.current + interimChunk).replace(/\s+/g, ' ').trim();
        setTranscriptInterim(fullSpokenText);
        setInputText(fullSpokenText);
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsRecording(false);
        if (err.error === 'not-allowed') {
          setMicStatusMsg('⚠️ Microphone access was denied. Please allow microphone permissions in your browser address bar.');
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.warn('Speech start error:', e);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const runDirectTriage = async (symptomsText = null) => {
    const query = symptomsText || inputText;
    if (!query.trim()) {
      setMicStatusMsg('⚠️ Please speak or type your symptoms first.');
      return;
    }

    if (isRecording) {
      stopVoiceRecording();
    }

    setLoading(true);
    setAssessment('');
    setMicStatusMsg('');

    try {
      const res = await axios.post(`${API_BASE}/ai/chat`, {
        prompt: `Patient Clinical Intake: ${query.trim()}`,
      });
      const answer = res.data.answer || 'Triage report generated.';
      setAssessment(answer);
      speakText(answer);
    } catch (e) {
      setAssessment('⚠️ Failed to run triage evaluation. Please check your backend connection.');
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

  const handleReset = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
    setIsSpeaking(false);
    setIsRecording(false);
    setInputText('');
    setTranscriptInterim('');
    setAssessment('');
    setMicStatusMsg('');
  };

  const symptomPresets = [
    'I am suffering with cold and sneezing for 2 days',
    'Mild continuous fever (100°F) with severe headache',
    'Dry cough and sore throat with fatigue for 3 days',
    'Stomach pain and mild nausea after food',
  ];

  return (
    <div className="space-y-6 max-w-5xl xl:max-w-6xl w-full mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            Clinical Intake & Triaging
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🏥</span> MediKiosk — Clinical AI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time live voice intake, editable transcription, and immediate clinical triage diagnosis via LLM.
          </p>
        </div>

        {assessment && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            🔄 New Intake
          </button>
        )}
      </div>

      {/* Clinical Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-center gap-2.5">
        <span className="text-lg shrink-0">⚠️</span>
        <div>
          <strong>Clinical Notice:</strong> AI can make mistakes. This assistant is for preliminary intake and informational guidance only. In medical emergencies, consult a licensed healthcare professional immediately.
        </div>
      </div>

      {/* Main Direct Voice Listening Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-6">
        {/* Top Header Prompt */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <span>✨</span> AI CLINICAL ASSISTANT • DIRECT SYMPTOM INTAKE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              Speak or type your symptoms freely to receive an instant clinical assessment:
            </h2>
          </div>

          {assessment && (
            <button
              onClick={() => speakText(assessment)}
              className={`p-3 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700'
              }`}
              title="Listen to Assessment"
            >
              <span className="text-lg">🔊</span>
            </button>
          )}
        </div>

        {/* Live Speech Recognition Equalizer & Stream Panel */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-teal-500/30 text-center space-y-5 shadow-xl shadow-teal-500/5">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-2">
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

          {/* Animated Equalizer Sound Waves */}
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

          {/* Interactive Microphone & Action Controls */}
          <div className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`px-7 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/50 animate-pulse active:scale-95'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-xl shadow-teal-500/25 hover:scale-105 active:scale-95'
              }`}
            >
              {isRecording ? (
                <>
                  <span className="text-lg">⏹️</span>
                  <span className="text-sm font-black tracking-wide">Stop Recording & Edit Text</span>
                </>
              ) : (
                <>
                  <span className="text-lg animate-bounce">🎙️</span>
                  <span className="text-sm font-black tracking-wide">Tap to Speak (Live Recognition)</span>
                </>
              )}
            </button>

            {inputText && (
              <button
                onClick={() => runDirectTriage(inputText)}
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🩺</span> {loading ? 'Evaluating...' : 'Run Triage Diagnosis'}
              </button>
            )}
          </div>

          {/* Editable Live Symptom Input Area */}
          <div className="text-left space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-400 px-1">
              <span className="flex items-center gap-1.5">
                <span>📈</span>
                <span>Symptom Transcription (You can edit or type anytime):</span>
              </span>
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setTranscriptInterim('');
                  }}
                  className="text-slate-400 hover:text-rose-400 font-semibold cursor-pointer lowercase"
                >
                  clear text
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Spoken words will appear here live. You can freely edit, add more symptoms, or type here before submitting..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-900 text-sm font-sans text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          {/* Status message or error banner */}
          {micStatusMsg && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold text-center">
              {micStatusMsg}
            </div>
          )}
        </div>

        {/* Quick Symptom Presets (1-click test) */}
        <div>
          <div className="text-xs font-bold text-slate-400 mb-2">⚡ Quick 1-Click Clinical Scenarios:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {symptomPresets.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(preset);
                  runDirectTriage(preset);
                }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-teal-500/20 hover:border-teal-500/40 border border-slate-700 text-slate-200 text-xs font-semibold text-left transition-all cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Running Clinical Intake Triage via LLM...</h3>
          <p className="text-xs text-slate-500">Evaluating likely conditions, triage severity level, and home care remedies...</p>
        </div>
      )}

      {/* Full Clinical Assessment Report Generated by LLM */}
      {assessment && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-scale-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🩺</span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  MediKiosk Clinical Triage Report
                </h3>
                <span className="text-[11px] text-slate-400">
                  Evaluated at {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(assessment)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{isSpeaking ? '⏹️ Stop Audio' : '🔊 Read Out Loud'}</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                + New Patient Intake
              </button>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {assessment}
          </div>
        </div>
      )}
    </div>
  );
}
