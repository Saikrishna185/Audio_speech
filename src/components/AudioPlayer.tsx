import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, Radio, CheckCircle2, Music2 } from 'lucide-react';
import { SupportedLanguage, VoiceTone } from '../types';

interface AudioPlayerProps {
  audioBlob: Blob | null;
  audioUrl: string | null;
  scriptText: string;
  language: SupportedLanguage;
  tone: VoiceTone;
  voice?: string;
  durationSeconds?: number;
  isLoading?: boolean;
  isQuotaLimited?: boolean;
  modelUsed?: string;
  onPlayTriggered?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBlob,
  audioUrl,
  scriptText,
  language,
  tone,
  voice,
  durationSeconds = 0,
  isLoading = false,
  isQuotaLimited = false,
  modelUsed,
  onPlayTriggered,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Convert Blob or data URL into an Object URL
  useEffect(() => {
    let url: string | null = null;

    if (audioBlob) {
      url = URL.createObjectURL(audioBlob);
      setBlobUrl(url);
    } else if (audioUrl && audioUrl.startsWith('data:')) {
      try {
        // Convert base64 data URL to Blob and create Object URL
        const base64Data = audioUrl.split(',')[1];
        const binaryStr = window.atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const wavBlob = new Blob([bytes], { type: 'audio/wav' });
        url = URL.createObjectURL(wavBlob);
        setBlobUrl(url);
      } catch (e) {
        setBlobUrl(audioUrl);
      }
    } else if (audioUrl) {
      setBlobUrl(audioUrl);
    }

    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioBlob, audioUrl]);

  // Handle new track load: set volume=1.0 and muted=false
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);

    // Explicit volume requirements
    audio.volume = volume;
    audio.muted = isMuted;

    if (durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [blobUrl, durationSeconds]);

  // Resume Web Audio context helper
  const resumeAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn('AudioContext resume notice:', e);
    }
  }, []);

  // HTML5 Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      audio.volume = volume;
      audio.muted = isMuted;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, isMuted]);

  // Audio Play / Pause toggle with AudioContext resume
  const togglePlay = () => {
    resumeAudioContext();
    onPlayTriggered?.();

    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Audio playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleRestart = () => {
    resumeAudioContext();
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(1.0);
        audioRef.current.volume = 1.0;
      }
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Waveform canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const numBars = 44;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / numBars) * 0.65;
      const gap = (width / numBars) * 0.35;
      const progressRatio = duration > 0 ? currentTime / duration : 0;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + gap);
        const barRatio = i / numBars;

        let barHeight = 6;
        if (isPlaying) {
          const wave1 = Math.sin(phase + i * 0.35) * 0.5 + 0.5;
          const wave2 = Math.cos(phase * 1.6 + i * 0.22) * 0.5 + 0.5;
          barHeight = 10 + (wave1 * 0.6 + wave2 * 0.4) * (height - 20);
        } else if (blobUrl) {
          const pseudoWave = Math.sin(i * 0.42) * 0.35 + Math.cos(i * 0.75) * 0.25 + 0.4;
          barHeight = 8 + pseudoWave * (height * 0.6);
        }

        const isPlayed = barRatio <= progressRatio;
        ctx.fillStyle = isPlayed ? '#0d9488' : '#cbd5e1'; // teal-600 vs slate-300

        const y = (height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.15;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, blobUrl]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const downloadFilename = `voiceover-${language.toLowerCase()}-${tone.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`;

  return (
    <div
      id="audio-playback-area"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all"
    >
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={blobUrl || undefined}
        preload="auto"
        id="native-html5-audio"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Playback & Export Area
              </h3>
              {blobUrl && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Format: <span className="font-semibold text-slate-700">24,000 Hz Linear PCM, 16-bit Mono WAV</span>
            </p>
          </div>
        </div>

        {/* Direct Download Button */}
        {blobUrl ? (
          <a
            id="download-audio-btn"
            href={blobUrl}
            download={downloadFilename}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-700 active:scale-[0.98] transition-all"
            title="Download full quality 24kHz WAV voiceover"
          >
            <Download className="h-4 w-4" />
            <span>Download Audio (WAV)</span>
          </a>
        ) : (
          <button
            id="download-audio-btn-disabled"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Download Audio (WAV)</span>
          </button>
        )}
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="relative my-5 overflow-hidden rounded-xl bg-slate-900 px-4 py-3 shadow-inner">
        <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Music2 className="h-3.5 w-3.5 text-teal-400" />
            {isPlaying ? 'PLAYING BROADCAST STREAM' : blobUrl ? 'AUDIO TRACK LOADED' : 'AWAITING GENERATION'}
          </span>
          <span className="font-mono text-teal-400 font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={72}
          className="h-16 w-full cursor-pointer"
          onClick={togglePlay}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 text-white">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
              <span className="text-xs font-medium tracking-wide">Synthesizing 24 kHz Broadcast Audio...</span>
            </div>
          </div>
        )}
      </div>

      {/* Seek Scrubber */}
      <div className="mb-4">
        <input
          id="audio-seek-slider"
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          disabled={!blobUrl}
          aria-label="Seek audio"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play, Pause, Restart */}
        <div className="flex items-center gap-2">
          <button
            id="audio-play-pause-btn"
            type="button"
            onClick={togglePlay}
            disabled={!blobUrl || isLoading}
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold shadow-sm transition-all active:scale-95 ${
              !blobUrl || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button
            id="audio-restart-btn"
            type="button"
            onClick={handleRestart}
            disabled={!blobUrl || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Speed Selection */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                id={`playback-rate-${rate}x`}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                  playbackRate === rate
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            id="audio-mute-toggle-btn"
            type="button"
            onClick={toggleMute}
            className="text-slate-500 hover:text-slate-800 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-rose-500" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            id="audio-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume slider"
            className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
          />
          <span className="w-8 text-[11px] font-mono text-slate-500 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Engine & Status Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
        <span>
          Audio Engine: <strong className="font-semibold text-slate-700">{modelUsed || '24 kHz Broadcast Audio Engine'}</strong>
        </span>
        <div className="flex items-center gap-3">
          {voice && (
            <span>
              Voice: <strong className="font-semibold text-teal-700">{voice}</strong>
            </span>
          )}
          <span>Sample Rate: <strong className="font-mono text-slate-700">24 kHz</strong></span>
        </div>
      </div>
    </div>
  );
};
