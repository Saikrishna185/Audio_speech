import React from 'react';
import { AudioRecord } from '../types';
import { Play, Download, Trash2, History, Globe, Music2 } from 'lucide-react';

interface VoiceoverHistoryProps {
  history: AudioRecord[];
  onPlayRecord: (record: AudioRecord) => void;
  onClearHistory: () => void;
}

export const VoiceoverHistory: React.FC<VoiceoverHistoryProps> = ({
  history,
  onPlayRecord,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div id="voiceover-history-card" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recent Voiceover Takes & History
          </h3>
        </div>
        <button
          id="clear-history-btn"
          type="button"
          onClick={onClearHistory}
          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear All
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {history.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate">
                {item.text}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                  <Globe className="h-3 w-3" />
                  {item.language}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-600">{item.tone}</span>
                <span>•</span>
                <span className="font-mono">{item.durationSeconds}s</span>
                <span>•</span>
                <span className="text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onPlayRecord(item)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors shadow-sm"
                title="Load and play this voiceover take"
              >
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </button>

              <a
                href={item.audioUrl}
                download={`voiceover_${item.language.toLowerCase()}_${item.id}.wav`}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
                title="Download Audio (WAV)"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
