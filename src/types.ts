export type SupportedLanguage = 'Odia' | 'Hindi' | 'Telugu' | 'English';

export type VoiceTone =
  | 'Marketing / High Energy'
  | 'Professional / Reassuring'
  | 'Casual / Friendly';

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  sampleScript: string;
  description: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  gender: 'female' | 'male';
  description: string;
}

export interface PresetScript {
  id: string;
  language: SupportedLanguage;
  title: string;
  tone: VoiceTone;
  scriptText: string;
  englishTranslation: string;
  durationEstimate: string;
}

export interface AudioRecord {
  id: string;
  text: string;
  voice: string;
  tone: VoiceTone;
  language: SupportedLanguage;
  audioUrl: string;
  durationSeconds: number;
  timestamp: string;
  isFallback?: boolean;
  isQuotaLimited?: boolean;
}
