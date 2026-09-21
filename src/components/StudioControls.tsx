import React from 'react';
import { Sparkles, Trash2, Globe, Volume2, UserCheck, Copy, Check } from 'lucide-react';
import { SupportedLanguage, VoiceTone } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_TONES, AVAILABLE_VOICES } from '../data/presets';

interface StudioControlsProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  selectedTone: VoiceTone;
  onToneChange: (tone: VoiceTone) => void;
  scriptText: string;
  onScriptChange: (text: string) => void;
  onGenerateVoiceover: () => void;
  onClearText: () => void;
  isGenerating: boolean;
  error?: string | null;
  quotaNotice?: string | null;
  onLoadPresetSample?: (lang: SupportedLanguage) => void;
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  selectedLanguage,
  onLanguageChange,
  selectedVoice,
  onVoiceChange,
  selectedTone,
  onToneChange,
  scriptText,
  onScriptChange,
  onGenerateVoiceover,
  onClearText,
  isGenerating,
  error,
  quotaNotice,
  onLoadPresetSample,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!scriptText) return;
    try {
      await navigator.clipboard.writeText(scriptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const EXPRESSION_TAGS = [
    { tag: '[excited, confident]', label: '⚡ [excited, confident]' },
    { tag: '[warm, reassuring]', label: '☀️ [warm, reassuring]' },
    { tag: '[caring, thoughtful]', label: '💚 [caring, thoughtful]' },
    { tag: '[pause=0.3s]', label: '⏱️ [pause=0.3s]' },
    { tag: '[pause=0.5s]', label: '⏱️ [pause=0.5s]' },
  ];

  const handleInsertTag = (tag: string) => {
    const textarea = document.getElementById('script-text-input') as HTMLTextAreaElement | null;
    if (!textarea) {
      onScriptChange(scriptText ? `${scriptText} ${tag}` : tag);
      return;
    }
    const start = textarea.selectionStart ?? scriptText.length;
    const end = textarea.selectionEnd ?? scriptText.length;
    const before = scriptText.substring(0, start);
    const after = scriptText.substring(end);
    const spaceBefore = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const spaceAfter = after.length > 0 && !after.startsWith(' ') ? ' ' : '';
    const newText = `${before}${spaceBefore}${tag}${spaceAfter}${after}`;
    onScriptChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + spaceBefore.length + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const charCount = scriptText.length;
  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(2, Math.round(wordCount * 0.45));

  return (
    <div className="space-y-6">
      {/* Configuration Selectors Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Language Dropdown */}
          <div>
            <label
              htmlFor="language-select"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
            >
              <Globe className="h-4 w-4 text-teal-600" />
              Language Dropdown
            </label>
            <div className="relative">
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                ▼
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Select target regional language for natural pronunciation.
            </p>
          </div>

          {/* Voice Selection Dropdown */}
          <div>
            <label
              htmlFor="voice-select"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
            >
              <UserCheck className="h-4 w-4 text-teal-600" />
              Voice Selection
            </label>
            <div className="relative">
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                ▼
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Kore (default warm & energetic) or Zephyr (articulate delivery) across all supported languages.
            </p>
          </div>

          {/* Voice Style / Tone Selector */}
          <div>
            <label
              htmlFor="tone-select"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
            >
              <Volume2 className="h-4 w-4 text-teal-600" />
              Voice Style / Tone Selector
            </label>
            <div className="relative">
              <select
                id="tone-select"
                value={selectedTone}
                onChange={(e) => onToneChange(e.target.value as VoiceTone)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {VOICE_TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                ▼
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Adapts vocal energy, inflection, tempo, and regional cadence.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets Bar */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Quick Samples:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  id={`load-sample-${lang.id.toLowerCase()}`}
                  type="button"
                  onClick={() => onLoadPresetSample?.(lang.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedLanguage === lang.id
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Load {lang.name} Sample
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Text Input Script Editor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* One-Click Expression & Cadence Tags */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              One-Click Expression & Cadence Tags
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click to insert delivery cue at cursor
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {EXPRESSION_TAGS.map((item) => (
              <button
                key={item.tag}
                id={`tag-${item.tag.replace(/[^a-zA-Z0-9]/g, '-')}`}
                type="button"
                onClick={() => handleInsertTag(item.tag)}
                className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs font-mono"
                title={`Insert ${item.tag} tag`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="script-text-input"
            className="text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Voiceover Script (Text Input)
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>{charCount} characters</span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>~{estimatedSeconds}s audio</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="script-text-input"
            rows={5}
            value={scriptText}
            onChange={(e) => onScriptChange(e.target.value)}
            placeholder="Enter or paste your voiceover script here in Odia, Hindi, Telugu, or English..."
            className="w-full rounded-xl border border-slate-300 p-4 text-base leading-relaxed text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="clear-text-btn"
              type="button"
              onClick={onClearText}
              disabled={!scriptText || isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors shadow-sm"
              title="Clear all text from textarea"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Text</span>
            </button>

            <button
              id="copy-text-btn"
              type="button"
              onClick={handleCopy}
              disabled={!scriptText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors shadow-sm"
              title="Copy script text"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Action: Generate Voiceover */}
          <button
            id="generate-voiceover-btn"
            type="button"
            onClick={onGenerateVoiceover}
            disabled={!scriptText.trim() || isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating Voiceover...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Voiceover</span>
              </>
            )}
          </button>
        </div>

        {/* Quota Safeguard Notice */}
        {quotaNotice && (
          <div
            id="quota-notice-alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800"
          >
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-0.5">
              <span>Studio Notice</span>
            </div>
            <p className="leading-relaxed">{quotaNotice}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            id="error-alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
          >
            <div className="flex items-center gap-2 font-bold text-rose-900 mb-0.5">
              <span>Generation Error</span>
            </div>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
