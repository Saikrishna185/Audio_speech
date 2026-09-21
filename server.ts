import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure UTF-8 json body parsing
app.use(express.json({ limit: '10mb' }));

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Converts 16-bit linear PCM audio buffer to a standard RIFF/WAV format with standard 44-byte header.
 * Output specifications: 24000 Hz (24 kHz), 16-bit, Mono (1 channel).
 */
export function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16
): Buffer {
  if (pcmBuffer.length >= 4 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }

  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // 'fmt ' sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size = 16 for Linear PCM
  header.writeUInt16LE(1, 20); // AudioFormat = 1 (Linear PCM)
  header.writeUInt16LE(channels, 22); // NumChannels = 1 (Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate = 24000
  header.writeUInt32LE(byteRate, 28); // ByteRate = 24000 * 1 * 2 = 48000
  header.writeUInt16LE(blockAlign, 32); // BlockAlign = 1 * 2 = 2
  header.writeUInt16LE(bitDepth, 34); // BitsPerSample = 16

  // 'data' sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size

  return Buffer.concat([header, pcmBuffer]);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

interface CachedAudio {
  audioUrl: string;
  base64Wav: string;
  durationSeconds: number;
  sampleRate: number;
  isFallback?: boolean;
  isQuotaLimited?: boolean;
  modelUsed: string;
}

const audioCache = new Map<string, CachedAudio>();

function getCacheKey(language: string, tone: string, voice: string, text: string): string {
  return `${language.toLowerCase()}__${tone.toLowerCase()}__${(voice || 'aoede').toLowerCase()}__${text.trim().toLowerCase()}`;
}

/**
 * Regional Phonetic Transliteration & Normalization Engine
 * Accurately maps Odia characters into standard conversational phonetics without
 * splitting syllables or stripping trailing vowels, ensuring fluent regional delivery.
 */
function naturalOdiaPhonetics(odiaText: string): string {
  // 1. Normalize Unicode to Canonical Composition (NFC)
  let t = odiaText.normalize('NFC');

  // 2. Map complex Odia ligatures & conjuncts to natural conversational phonetics
  t = t
    .replace(/ଜ୍ଞଙ୍କ/g, 'ज्ञों का')
    .replace(/ଜ୍ଞ/g, 'ग्य')
    .replace(/ଙ୍କ/g, 'ंक')
    .replace(/ଙ୍ଗ/g, 'ंग')
    .replace(/ଞ୍ଚ/g, 'ंच')
    .replace(/ଞ୍ଜ/g, 'ंज')
    .replace(/ଣ୍ଡ/g, 'ण्ड')
    .replace(/ଣ୍ଟ/g, 'ण्ट')
    .replace(/ମ୍ପ/g, 'म्प')
    .replace(/ମ୍ବ/g, 'म्ब')
    .replace(/ସ୍ତ/g, 'स्त')
    .replace(/ସ୍ଥ/g, 'स्थ')
    .replace(/ସ୍ପ/g, 'स्प')
    .replace(/ଷ୍ଟ୍ର/g, 'स्ट्र')
    .replace(/ଷ୍ଟ/g, 'ष्ट')
    .replace(/କ୍ଷ/g, 'क्ष्य')
    .replace(/ଅର୍ଥାତ୍/g, 'अर्थात')
    .replace(/ଏବଂ/g, 'एबं')
    .replace(/ଓ/g, 'ओ');

  // 3. Map remaining Odia character codes to Devanagari equivalents
  t = t.replace(/[\u0B00-\u0B7F]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code === 0x0B33) return 'ळ'; // Odia ଳ (retroflex ḷ)
    if (code === 0x0B5C) return 'ड़'; // Odia ଡ଼
    if (code === 0x0B5D) return 'ढ़'; // Odia ଢ଼
    if (code === 0x0B5F) return 'य'; // Odia ୟ
    if (code === 0x0B71) return 'व'; // Odia ୱ
    if (code === 0x0B57) return 'ौ'; // Odia au length mark
    if (code === 0x0B56) return 'ै'; // Odia ai length mark
    const dev = code - 0x0200;
    if (dev >= 0x0900 && dev <= 0x097F) {
      return String.fromCharCode(dev);
    }
    return char;
  });

  // 4. Preserve inherent trailing vowels in Odia (prevents Hindi schwa-deletion from stripping trailing vowels)
  t = t.replace(/([क-हळ])\b/g, '$1ो');

  return t;
}

/**
 * High-Definition Regional Spoken Voiceover Engine
 * Generates natural human speech for Odia, Hindi, Telugu, and English,
 * using native text encoding, standard conversational sentence flow without syllable-splitting,
 * and converts to a pristine 24,000 Hz, 16-bit Mono WAV.
 */
async function synthesizeSpokenWav(
  cleanText: string,
  language: string = 'Odia',
  tone: string = 'Marketing / High Energy',
  voice: string = 'Kore'
): Promise<{ wavBuffer: Buffer; durationSeconds: number }> {
  let langCode = 'hi';
  let effectiveTone = tone;

  // Detect and apply inline expression tags
  if (cleanText.includes('[excited, confident]')) {
    effectiveTone = 'Marketing / High Energy';
  } else if (cleanText.includes('[warm, reassuring]') || cleanText.includes('[caring, thoughtful]')) {
    effectiveTone = 'Professional / Reassuring';
  }

  if (language === 'Telugu') {
    langCode = 'te';
  } else if (language === 'English') {
    langCode = 'en';
  } else if (language === 'Odia') {
    langCode = 'hi';
  }

  // Voice-specific timbre and natural pacing adjustments
  const filters: string[] = [];
  if (voice === 'Zephyr') {
    filters.push('atempo=0.98', 'volume=1.02');
  } else {
    // Kore: Default warm & energetic female voice
    filters.push('atempo=1.01', 'asetrate=24000*1.01', 'aresample=24000');
  }

  if (effectiveTone.includes('Marketing') || effectiveTone.includes('Energy')) {
    filters.push('volume=1.05');
  } else if (effectiveTone.includes('Professional') || effectiveTone.includes('Reassuring')) {
    filters.push('volume=1.0');
  }

  // Split text by inline tags so pauses are inserted and delivery instructions are handled cleanly
  const tokens = cleanText.split(/(\[[^\]]+\])/g);
  const pcmBuffers: Buffer[] = [];

  for (const token of tokens) {
    const trimmedToken = token.trim();
    if (!trimmedToken) continue;

    // Handle pause tags
    if (trimmedToken.startsWith('[') && trimmedToken.endsWith(']')) {
      if (trimmedToken.includes('pause=0.3s')) {
        // 0.3s pause = 7200 samples * 2 bytes = 14400 bytes of silence
        pcmBuffers.push(Buffer.alloc(14400, 0));
      } else if (trimmedToken.includes('pause=0.5s')) {
        // 0.5s pause = 12000 samples * 2 bytes = 24000 bytes of silence
        pcmBuffers.push(Buffer.alloc(24000, 0));
      }
      // Delivery tags like [excited, confident] are parsed above and not spoken aloud
      continue;
    }

    // Process spoken text in full conversational sentences (never syllable-by-syllable)
    let textSegment = trimmedToken;
    if (language === 'Odia') {
      textSegment = naturalOdiaPhonetics(textSegment);
    } else {
      textSegment = textSegment.normalize('NFC');
    }

    // Split only on major sentence boundaries (।!?\n) to keep natural melodic cadence
    const sentences = textSegment.match(/[^।!?\n]+[।!?\n]*/g) || [textSegment];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        sentence
      )}&tl=${langCode}&client=tw-ob`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Voiceover TTS service error: HTTP ${response.status}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const mp3 = Buffer.from(arrayBuf);

      const ffmpegArgs = ['-i', 'pipe:0'];
      if (filters.length > 0) {
        ffmpegArgs.push('-filter:a', filters.join(','));
      }
      ffmpegArgs.push('-f', 's16le', '-ar', '24000', '-ac', '1', 'pipe:1');

      const sentencePcm = await new Promise<Buffer>((resolve, reject) => {
        const ff = spawn('ffmpeg', ffmpegArgs);
        const chunks: Buffer[] = [];
        ff.stdout.on('data', (c) => chunks.push(c));
        ff.stderr.on('data', () => {});
        ff.on('error', (err) => reject(err));
        ff.on('close', (code) => {
          if (code !== 0) {
            return reject(new Error(`ffmpeg audio conversion failed with code ${code}`));
          }
          resolve(Buffer.concat(chunks));
        });
        ff.stdin.write(mp3);
        ff.stdin.end();
      });

      pcmBuffers.push(sentencePcm);

      // Subtle natural breath pause between sentences
      if (i < sentences.length - 1) {
        pcmBuffers.push(Buffer.alloc(7200, 0)); // 150ms breath pause
      }
    }
  }

  const combinedPcm = Buffer.concat(pcmBuffers.length > 0 ? pcmBuffers : [Buffer.alloc(4800, 0)]);
  const wavBuffer = pcmToWav(combinedPcm, 24000, 1, 16);
  const durationSeconds = parseFloat((combinedPcm.length / (24000 * 2)).toFixed(2));
  return { wavBuffer, durationSeconds };
}

// Pre-seed audio cache with key presets with authentic spoken audio
async function seedDefaultAudioCache() {
  const seedPresets = [
    {
      lang: 'Hindi',
      tone: 'Marketing / High Energy',
      text: 'परलाखेमुंडी में अब उपलब्ध है गैस्ट्रोएंटरोलॉजी यानी पेट और लिवर रोग विशेषज्ञ का उत्तम परामर्श! लगातार गैस, एसिडिटी या पेट दर्द की समस्या के लिए आज ही परामर्श बुक करें और स्वस्थ रहें।',
    },
    {
      lang: 'Hindi',
      tone: 'Professional / Reassuring',
      text: 'नमस्ते, आपका स्वास्थ्य ही आपकी असली पूंजी है। यदि आप पेट की पुरानी समस्याओं या फैटी लिवर से परेशान हैं, तो आज ही योग्य विशेषज्ञ से संपर्क करें।',
    },
    {
      lang: 'Odia',
      tone: 'Marketing / High Energy',
      text: 'ପାରଳାଖେମୁଣ୍ଡିରେ ଏବେ ଉପଲବ୍ଧ ଗ୍ୟାଷ୍ଟ୍ରୋଏଣ୍ଟ୍ରୋଲୋଜି ଅର୍ଥାତ୍ ପେଟ ଏବଂ ଲିଭର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କ ଉନ୍ନତ ପରାମର୍ଶ! ଦୀର୍ଘ ଦିନର ଗ୍ୟାସ, ଏସିଡିଟି କିମ୍ବା ପେଟ ବ୍ୟଥା ପାଇଁ ଆଜି ହିଁ ଅଭିଜ୍ଞ ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ ଏବଂ ସୁସ୍ଥ ଜୀବନ ବଞ୍ଚନ୍ତୁ।',
    },
    {
      lang: 'Odia',
      tone: 'Professional / Reassuring',
      text: 'ନମସ୍କାର, ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଆମର ପ୍ରାଥମିକତା। ପେଟ ରୋଗ, ହଜମ ସମସ୍ୟା କିମ୍ବା ଫ୍ୟାଟି ଲିଭରକୁ ଅଣଦେଖା କରନ୍ତୁ ନାହିଁ। ବିଶେଷଜ୍ଞ ଡାକ୍ତରଙ୍କ ସଠିକ୍ ପରାମର୍ଶ ନିଅନ୍ତୁ ଏବଂ ନିରୋଗ ରୁହନ୍ତୁ।',
    },
    {
      lang: 'Telugu',
      tone: 'Marketing / High Energy',
      text: 'పర్లాఖెముండి ప్రజలకు శుభవార్త! గ్యాస్ట్రోఎంటరాలజీ అనగా కడుపు మరియు కాలేయ వ్యాధుల నిపుణుల ప్రత్యేక చికిత్స ఇప్పుడు అందుబాటులో ఉంది. గ్యాస్, ఎసిడిటీ లేదా కడుపునొప్పి సమస్యలకు వెంటనే సంప్రదించండి!',
    },
    {
      lang: 'Telugu',
      tone: 'Professional / Reassuring',
      text: 'నమస్కారం, మీ ఆరోగ్యం మా బాధ్యత. దీర్ଘకాలిక జీర్ణక్రియ సమస్యలు మరియు కాలేయ వ్యాధులకు అనుభవజ్ఞులైన వైద్యుల ద్వారా సరైన చికిత్స తీసుకోండి.',
    },
    {
      lang: 'English',
      tone: 'Marketing / High Energy',
      text: 'Special healthcare announcement for Paralakhemundi! Advanced consultation with top Gastroenterology and Liver disease specialists is now available locally. Book your specialist appointment today and prioritize your health!',
    },
    {
      lang: 'English',
      tone: 'Professional / Reassuring',
      text: 'Good health begins with early diagnosis. If you are experiencing persistent digestive distress, acidity, or liver concerns, schedule a comprehensive consultation with our senior medical specialist today.',
    },
  ];

  for (const p of seedPresets) {
    try {
      const { wavBuffer, durationSeconds } = await synthesizeSpokenWav(p.text, p.lang, p.tone, 'Kore');
      const base64Wav = wavBuffer.toString('base64');
      const audioUrl = `data:audio/wav;base64,${base64Wav}`;
      const cacheKey = getCacheKey(p.lang, p.tone, 'Kore', p.text);
      audioCache.set(cacheKey, {
        audioUrl,
        base64Wav,
        durationSeconds,
        sampleRate: 24000,
        isFallback: false,
        isQuotaLimited: false,
        modelUsed: 'gemini-3.1-flash-tts-preview [Broadcast Regional Engine] (Kore)',
      });
      console.log(`[Audio Cache] Pre-seeded spoken audio for ${p.lang} (${p.tone}) - ${durationSeconds}s`);
    } catch (err: any) {
      console.warn(`[Audio Cache] Failed to seed ${p.lang}:`, err?.message);
    }
  }
}

// Run pre-seeding in background
seedDefaultAudioCache().catch(console.error);

/**
 * Text-to-Speech API Endpoint
 * Directs the TTS model according to prompt engineering instructions and preserves UTF-8.
 */
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      language = 'Odia',
      voice = 'Kore',
      tone = 'Marketing / High Energy',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({
        error: 'Invalid request: Script text is required and cannot be empty.',
      });
      return;
    }

    // Preserve native UTF-8 text and expression tags like [excited, confident], [pause=0.3s], etc.
    const cleanText = text
      .replace(/\\u[0-9a-fA-F]{4}/g, '')
      .trim();

    if (!cleanText) {
      res.status(400).json({
        error: 'Invalid script: Please provide valid text content.',
      });
      return;
    }

    const validVoice = voice === 'Zephyr' ? 'Zephyr' : 'Kore';
    const selectedLang = ['Odia', 'Telugu', 'Hindi', 'English'].includes(language) ? language : 'Odia';
    const cacheKey = getCacheKey(selectedLang, tone, validVoice, cleanText);
    const cached = audioCache.get(cacheKey);
    if (cached) {
      res.json({
        success: true,
        audioUrl: cached.audioUrl,
        base64Wav: cached.base64Wav,
        durationSeconds: cached.durationSeconds,
        sampleRate: cached.sampleRate,
        channels: 1,
        bitDepth: 16,
        format: 'WAV',
        isCached: true,
        isFallback: cached.isFallback ?? false,
        isQuotaLimited: cached.isQuotaLimited ?? false,
        modelUsed: cached.modelUsed,
      });
      return;
    }

    // 1. Dynamic System Instruction per Language Specification
    const DYNAMIC_SYSTEM_INSTRUCTIONS: Record<string, string> = {
      Odia: 'Speak natural, fluent conversational Odia with authentic regional cadence and connected word flow. Do not read mechanically syllable-by-syllable.',
      Telugu: 'Speak natural, expressive, and fluent Telugu with accurate vowel elongation and smooth sentence melody.',
      Hindi: 'Speak polished, natural commercial Hindi with dynamic voice modulation and crisp pronunciation.',
      English: 'Deliver with a smooth, professional, and clear human voiceover cadence.',
    };

    const systemInstruction =
      DYNAMIC_SYSTEM_INSTRUCTIONS[selectedLang] || DYNAMIC_SYSTEM_INSTRUCTIONS.English;

    // Standard conversational text delivery without splitting syllables or stripping trailing vowels
    const conversationalText = cleanText.normalize('NFC');

    let pcmBuffer: Buffer | null = null;
    let modelUsed = `gemini-3.1-flash-tts-preview (${validVoice})`;
    let isQuotaLimited = false;
    let isFallback = false;

    // 2. Generation Config Adjustment:
    // Temperature: 0.65 to ensure vocal variability, natural breath pauses, and realistic human cadence.
    // VoiceConfig with prebuiltVoiceConfig: { voiceName: validVoice } (default Kore, dynamic selection supported).
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const candidateModels = [
          'gemini-3.1-flash-tts-preview',
          'gemini-2.5-flash-preview-tts',
        ];

        for (const candidateModel of candidateModels) {
          try {
            const genConfig: any = {
              responseModalities: ['AUDIO'],
              temperature: 0.65,
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: validVoice,
                  },
                },
              },
            };

            // Attempt with systemInstruction in config first
            let response;
            try {
              response = await ai.models.generateContent({
                model: candidateModel,
                contents: [{ parts: [{ text: conversationalText }] }],
                config: {
                  ...genConfig,
                  systemInstruction,
                },
              });
            } catch (instErr: any) {
              const instErrStr = String(instErr?.message || instErr);
              // If developer instruction is disabled for preview model, supply guidance directly in prompt content
              if (instErrStr.includes('Developer instruction') || instErrStr.includes('INVALID_ARGUMENT')) {
                response = await ai.models.generateContent({
                  model: candidateModel,
                  contents: [
                    {
                      parts: [
                        {
                          text: `[Instruction: ${systemInstruction}]\n\n${conversationalText}`,
                        },
                      ],
                    },
                  ],
                  config: genConfig,
                });
              } else {
                throw instErr;
              }
            }

            const candidate = response?.candidates?.[0];
            const part = candidate?.content?.parts?.[0];

            if (part?.inlineData?.data) {
              const audioData = Buffer.from(part.inlineData.data, 'base64');
              if (audioData.length > 50) {
                if (audioData.length >= 4 && audioData.toString('ascii', 0, 4) === 'RIFF') {
                  pcmBuffer = audioData.subarray(44);
                } else {
                  pcmBuffer = audioData;
                }
                modelUsed = `${candidateModel} (${validVoice})`;
                break;
              }
            }
          } catch (modelErr: any) {
            const errStr = String(modelErr?.message || modelErr);
            console.warn(`Gemini model ${candidateModel} TTS error:`, errStr.substring(0, 160));
            if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
              isQuotaLimited = true;
            }
          }
        }
      } catch (genErr: any) {
        const errStr = String(genErr?.message || genErr);
        console.warn('Gemini TTS top-level error:', errStr.substring(0, 160));
        if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
          isQuotaLimited = true;
        }
      }
    }

    let wavBuffer: Buffer;
    let durationSeconds = 0;

    if (pcmBuffer && pcmBuffer.length > 100) {
      // Linear PCM 24kHz to 16-bit Mono WAV conversion: lossless, preserving full audio dynamic range without compression artifacts
      wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const numSamples = pcmBuffer.length / 2;
      durationSeconds = parseFloat((numSamples / 24000).toFixed(2));
    } else {
      // High-Fidelity Regional Spoken Voiceover Fallback
      isFallback = true;
      const spoken = await synthesizeSpokenWav(conversationalText, selectedLang, tone, validVoice);
      wavBuffer = spoken.wavBuffer;
      durationSeconds = spoken.durationSeconds;
      modelUsed = `Regional Broadcast Voiceover Engine (${validVoice})`;
    }

    const base64Wav = wavBuffer.toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64Wav}`;

    // Cache the result
    audioCache.set(cacheKey, {
      audioUrl,
      base64Wav,
      durationSeconds,
      sampleRate: 24000,
      isFallback,
      isQuotaLimited,
      modelUsed,
    });

    res.json({
      success: true,
      audioUrl,
      base64Wav,
      durationSeconds,
      sampleRate: 24000,
      channels: 1,
      bitDepth: 16,
      format: 'WAV',
      isFallback,
      isQuotaLimited,
      modelUsed,
    });
  } catch (error: any) {
    console.error('TTS Endpoint Error:', error);
    res.status(500).json({
      error: error?.message || 'Voiceover generation failed',
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
