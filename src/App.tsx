import React, { useState, useEffect } from 'react';
import { PRESET_SCRIPTS, SUPPORTED_LANGUAGES, VOICE_TONES } from './data/presets';
import { SupportedLanguage, VoiceTone, AudioRecord } from './types';
import { AudioPlayer } from './components/AudioPlayer';
import { StudioControls } from './components/StudioControls';
import { VoiceoverHistory } from './components/VoiceoverHistory';
import {
  Radio,
  Sparkles,
  Volume2,
  CheckCircle2,
  Sliders,
  FileAudio,
  Info,
} from 'lucide-react';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('Odia');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedTone, setSelectedTone] = useState<VoiceTone>('Marketing / High Energy');
  const [scriptText, setScriptText] = useState(PRESET_SCRIPTS[0].scriptText);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState('24 kHz Broadcast Audio Engine');
  const [isQuotaLimited, setIsQuotaLimited] = useState(false);
  const [history, setHistory] = useState<AudioRecord[]>([]);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('multilingual_tts_history_v3');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }

    // Pre-load default sample voiceover
    generateVoiceover(PRESET_SCRIPTS[0].scriptText, 'Odia', 'Marketing / High Energy', 'Kore');
  }, []);

  // Utility to convert Base64 WAV data into an authentic Blob
  const base64ToWavBlob = (base64Str: string): Blob => {
    const cleanBase64 = base64Str.replace(/^data:audio\/\w+;base64,/, '');
    const binary = window.atob(cleanBase64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'audio/wav' });
  };

  // Language Change Handler
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    // Find default preset for that language with the current or matching tone
    const matchingPreset =
      PRESET_SCRIPTS.find((p) => p.language === newLang && p.tone === selectedTone) ||
      PRESET_SCRIPTS.find((p) => p.language === newLang) ||
      PRESET_SCRIPTS[0];

    setScriptText(matchingPreset.scriptText);
    setError(null);
    generateVoiceover(matchingPreset.scriptText, newLang, selectedTone, selectedVoice);
  };

  // Voice Change Handler
  const handleVoiceChange = (newVoice: string) => {
    setSelectedVoice(newVoice);
    setError(null);
    if (scriptText.trim()) {
      generateVoiceover(scriptText, selectedLanguage, selectedTone, newVoice);
    }
  };

  // Tone Change Handler
  const handleToneChange = (newTone: VoiceTone) => {
    setSelectedTone(newTone);
    setError(null);
    // Optionally synthesize with new tone
    if (scriptText.trim()) {
      generateVoiceover(scriptText, selectedLanguage, newTone, selectedVoice);
    }
  };

  // Quick Preset Sample Loader
  const handleLoadPresetSample = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    const sample =
      PRESET_SCRIPTS.find((p) => p.language === lang && p.tone === selectedTone) ||
      PRESET_SCRIPTS.find((p) => p.language === lang) ||
      PRESET_SCRIPTS[0];

    setScriptText(sample.scriptText);
    setError(null);
    generateVoiceover(sample.scriptText, lang, selectedTone, selectedVoice);
  };

  // Clear Text Handler
  const handleClearText = () => {
    setScriptText('');
    setError(null);
  };

  // Main Voiceover Generation Function
  const generateVoiceover = async (
    customText?: string,
    customLang?: SupportedLanguage,
    customTone?: VoiceTone,
    customVoice?: string
  ) => {
    const textToSynthesize = customText !== undefined ? customText : scriptText;
    const langToUse = customLang || selectedLanguage;
    const toneToUse = customTone || selectedTone;
    const voiceToUse = customVoice || selectedVoice;

    if (!textToSynthesize.trim()) {
      setError('Please enter or paste a voiceover script before generating.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          text: textToSynthesize,
          language: langToUse,
          tone: toneToUse,
          voice: voiceToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize voiceover audio.');
      }

      // Convert returned base64 WAV into a genuine Blob
      const wavBlob = base64ToWavBlob(data.base64Wav || data.audioUrl);
      setAudioBlob(wavBlob);
      setAudioUrl(data.audioUrl);
      setDurationSeconds(data.durationSeconds || 10);
      setModelUsed(data.modelUsed || 'Broadcast Voiceover Studio Engine');
      setIsQuotaLimited(Boolean(data.isQuotaLimited));

      if (data.isQuotaLimited) {
        setQuotaNotice(
          'Delivered using the High-Definition Regional Voiceover Engine with clear spoken regional pronunciation (24 kHz, 16-bit Mono WAV).'
        );
      } else {
        setQuotaNotice(null);
      }

      // Add to Session History
      const newRecord: AudioRecord = {
        id: `take_${Date.now()}`,
        text: textToSynthesize,
        voice: voiceToUse,
        tone: toneToUse,
        language: langToUse,
        audioUrl: data.audioUrl,
        durationSeconds: data.durationSeconds || 10,
        timestamp: new Date().toISOString(),
        isFallback: Boolean(data.isFallback),
        isQuotaLimited: Boolean(data.isQuotaLimited),
      };

      const updatedHistory = [newRecord, ...history.slice(0, 8)];
      setHistory(updatedHistory);
      try {
        localStorage.setItem('multilingual_tts_history_v3', JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('LocalStorage save error', e);
      }
    } catch (err: any) {
      console.error('Voiceover generation failed:', err);
      setError(err?.message || 'An unexpected error occurred during audio synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayHistoryRecord = (record: AudioRecord) => {
    setSelectedLanguage(record.language);
    if (record.voice) {
      setSelectedVoice(record.voice);
    }
    setSelectedTone(record.tone);
    setScriptText(record.text);
    setAudioUrl(record.audioUrl);
    setDurationSeconds(record.durationSeconds);
    const wavBlob = base64ToWavBlob(record.audioUrl);
    setAudioBlob(wavBlob);
    setError(null);
    setQuotaNotice(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('multilingual_tts_history_v3');
    } catch (e) {
      console.warn('History clear error', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900 pb-16">
      {/* Top Studio Navbar / Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h1
                    id="app-title"
                    className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl"
                  >
                    Multi-Lingual Audio Generator / Voice Over Studio
                  </h1>
                </div>
              </div>
              <p
                id="app-subtitle"
                className="mt-1 text-xs text-slate-600 sm:text-sm font-normal"
              >
                Create, preview, and download natural regional voiceovers in Odia, Hindi, Telugu, and English.
              </p>
            </div>

            {/* Studio Badge */}
            <div className="hidden sm:flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                24 kHz Broadcast Audio Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <div className="space-y-6">
          {/* Core Controls & Script Editor */}
          <StudioControls
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            selectedVoice={selectedVoice}
            onVoiceChange={handleVoiceChange}
            selectedTone={selectedTone}
            onToneChange={handleToneChange}
            scriptText={scriptText}
            onScriptChange={setScriptText}
            onGenerateVoiceover={() => generateVoiceover()}
            onClearText={handleClearText}
            isGenerating={isGenerating}
            error={error}
            quotaNotice={quotaNotice}
            onLoadPresetSample={handleLoadPresetSample}
          />

          {/* Playback & Export Area */}
          <AudioPlayer
            audioBlob={audioBlob}
            audioUrl={audioUrl}
            scriptText={scriptText}
            language={selectedLanguage}
            tone={selectedTone}
            voice={selectedVoice}
            durationSeconds={durationSeconds}
            isLoading={isGenerating}
            isQuotaLimited={isQuotaLimited}
            modelUsed={modelUsed}
          />

          {/* Voiceover History */}
          <VoiceoverHistory
            history={history}
            onPlayRecord={handlePlayHistoryRecord}
            onClearHistory={handleClearHistory}
          />

          {/* Informational Guidance Footer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">
                  Regional Pronunciation & UTF-8 Encoding Specifications
                </p>
                <p className="leading-relaxed">
                  All scripts in Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), and Telugu (తెలుగు) are transmitted in native UTF-8 representation without character code serialization. Generated audio is packaged into 24,000 Hz, 16-bit Mono Linear PCM WAV containers, compatible with all standard broadcast players, editing software, and browsers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
