'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Volume2, ChevronDown } from 'lucide-react';

interface BlogReaderProps {
  title?: string;
  contentHtml?: string;
  content?: any[];
  plainText?: string;
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function extractPlainText(contentHtml?: string, content?: any[]): string {
  if (contentHtml) return stripHtml(contentHtml);
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (block.type === 'paragraph' || block.type === 'heading') {
          return block.text || '';
        }
        if (block.type === 'list' && Array.isArray(block.items)) {
          return block.items.join('. ');
        }
        if (block.type === 'quote') return block.text || '';
        if (block.type === 'callout') return block.text || '';
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return '';
}

/** Rank voices: natural/premium first, then platform defaults. */
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const en = voices.filter(v => v.lang.startsWith('en'));
  const pool = en.length ? en : voices;

  // Tier 1: premium / natural / neural voices
  const premium = pool.filter(v => {
    const n = v.name.toLowerCase();
    return (
      n.includes('natural') ||
      n.includes('neural') ||
      n.includes('enhanced') ||
      n.includes('premium') ||
      n.includes('wavenet') ||
      n.includes('samantha') ||
      n.includes('karen') ||
      n.includes('daniel') ||
      n.includes('alex') ||
      n.includes('google us english') ||
      n.includes('microsoft edge') ||
      n.includes('zira') ||
      n.includes('david')
    );
  });
  if (premium.length) {
    // prefer local (non-remote) voices
    return premium.find(v => !v.localService) || premium[0];
  }

  // Tier 2: any local voice
  const local = pool.filter(v => v.localService);
  if (local.length) return local[0];

  // Tier 3: default
  return pool.find(v => v.default) || pool[0];
}

/** Segment text into sentence-aware chunks so we can pause/resume smoothly. */
function splitIntoChunks(text: string, maxLen = 300): string[] {
  const sentences = text.replace(/\n+/g, ' \n ').split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if (buf.length + s.length + 1 > maxLen && buf) {
      chunks.push(buf.trim());
      buf = '';
    }
    buf += s + ' ';
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

export default function BlogReader({ title, contentHtml, content, plainText }: BlogReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const charOffsetRef = useRef(0);
  const totalCharsRef = useRef(0);
  const bestVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices
  useEffect(() => {
    const load = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        setAvailableVoices(voices.filter(v => v.lang.startsWith('en')));
        bestVoiceRef.current = pickBestVoice(voices);
        if (bestVoiceRef.current && !selectedVoiceName) {
          setSelectedVoiceName(bestVoiceRef.current.name);
        }
      }
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  const getFullText = useCallback(() => {
    const body = plainText || extractPlainText(contentHtml, content);
    return title ? `${title}. ${body}` : body;
  }, [title, plainText, contentHtml, content]);

  const getSelectedVoice = useCallback(() => {
    if (selectedVoiceName) {
      const v = availableVoices.find(v => v.name === selectedVoiceName);
      if (v) return v;
    }
    return bestVoiceRef.current;
  }, [selectedVoiceName, availableVoices]);

  const speakChunk = useCallback((chunk: string) => {
    return new Promise<void>((resolve) => {
      const utt = new SpeechSynthesisUtterance(chunk);
      const voice = getSelectedVoice();
      if (voice) utt.voice = voice;
      utt.rate = rate;
      utt.pitch = 1.05;
      utt.volume = 1;

      utt.onend = () => {
        const nextIdx = chunkIndexRef.current + 1;
        if (nextIdx < chunksRef.current.length) {
          chunkIndexRef.current = nextIdx;
          charOffsetRef.current += chunk.length;
          setProgress(Math.min(99, Math.round((charOffsetRef.current / totalCharsRef.current) * 100)));
          speakChunk(chunksRef.current[nextIdx]).then(resolve);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          resolve();
        }
      };

      utt.onerror = (e) => {
        if (e.error !== 'canceled') {
          setIsPlaying(false);
          setIsPaused(false);
        }
        resolve();
      };

      speechSynthesis.speak(utt);
    });
  }, [rate, getSelectedVoice]);

  const startReading = useCallback(() => {
    const text = getFullText();
    if (!text) return;

    speechSynthesis.cancel();

    const chunks = splitIntoChunks(text);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    charOffsetRef.current = 0;
    totalCharsRef.current = text.length;

    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);

    speakChunk(chunks[0]);
  }, [getFullText, speakChunk]);

  const handlePlay = useCallback(() => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }
    startReading();
  }, [isPaused, isPlaying, startReading]);

  const handleStop = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    charOffsetRef.current = 0;
  }, []);

  const handleRateChange = useCallback((newRate: number) => {
    setRate(newRate);
    setShowRateMenu(false);
    // Restart from current position with new rate
    if (isPlaying || isPaused) {
      const text = getFullText();
      if (!text) return;
      speechSynthesis.cancel();
      const chunks = splitIntoChunks(text);
      chunksRef.current = chunks;
      // Estimate which chunk we were at based on progress
      const charPos = Math.round((progress / 100) * text.length);
      let acc = 0;
      let startIdx = 0;
      for (let i = 0; i < chunks.length; i++) {
        if (acc + chunks[i].length >= charPos) { startIdx = i; break; }
        acc += chunks[i].length;
      }
      chunkIndexRef.current = startIdx;
      charOffsetRef.current = acc;
      totalCharsRef.current = text.length;
      setIsPlaying(true);
      setIsPaused(false);
      speakChunk(chunks[startIdx]);
    }
  }, [isPlaying, isPaused, progress, getFullText, speakChunk]);

  const handleVoiceChange = useCallback((voiceName: string) => {
    setSelectedVoiceName(voiceName);
    setShowVoiceMenu(false);
    // Restart with new voice if playing
    if (isPlaying || isPaused) {
      speechSynthesis.cancel();
      const text = getFullText();
      if (!text) return;
      const chunks = splitIntoChunks(text);
      chunksRef.current = chunks;
      chunkIndexRef.current = 0;
      charOffsetRef.current = 0;
      totalCharsRef.current = text.length;
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);
      speakChunk(chunks[0]);
    }
  }, [isPlaying, isPaused, getFullText, speakChunk]);

  const fullText = getFullText();
  if (!fullText) return null;

  const rateLabel = rate <= 0.75 ? '0.75x' : rate === 1 ? '1x' : rate === 1.25 ? '1.25x' : rate === 1.5 ? '1.5x' : `${rate}x`;
  const selectedVoiceObj = availableVoices.find(v => v.name === selectedVoiceName);
  const voiceLabel = selectedVoiceObj
    ? (selectedVoiceObj.name.length > 20 ? selectedVoiceObj.name.slice(0, 18) + '...' : selectedVoiceObj.name)
    : 'System default';

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={handlePlay}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#d71927] text-white shadow-sm transition-all hover:bg-[#b91420] hover:shadow-md active:scale-95"
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Read aloud'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {isPlaying ? 'Reading...' : isPaused ? 'Paused' : 'Listen to this article'}
            </span>
          </div>
          {(isPlaying || isPaused || progress > 0) && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#d71927] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-medium tabular-nums text-gray-400">{progress}%</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Voice selector */}
          <div className="relative">
            <button
              onClick={() => { setShowVoiceMenu(!showVoiceMenu); setShowRateMenu(false); }}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              title="Select voice"
            >
              <span className="max-w-[80px] truncate">{voiceLabel}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            {showVoiceMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 max-h-60 w-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {availableVoices.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">No voices available</div>
                ) : (
                  availableVoices.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleVoiceChange(v.name)}
                      className={`block w-full truncate px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                        selectedVoiceName === v.name
                          ? 'bg-red-50 font-semibold text-[#d71927]'
                          : 'text-gray-700'
                      }`}
                      title={v.name}
                    >
                      {v.name}
                      {v.localService ? '' : ' \u2601'}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Speed selector */}
          <div className="relative">
            <button
              onClick={() => { setShowRateMenu(!showRateMenu); setShowVoiceMenu(false); }}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {rateLabel}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showRateMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {[{ label: '0.75x Slow', value: 0.75 }, { label: '1x Normal', value: 1 }, { label: '1.25x', value: 1.25 }, { label: '1.5x Fast', value: 1.5 }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRateChange(opt.value)}
                    className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                      rate === opt.value
                        ? 'bg-red-50 font-semibold text-[#d71927]'
                        : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stop */}
          {(isPlaying || isPaused || progress > 0) && (
            <button
              onClick={handleStop}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              title="Stop"
            >
              <Square className="h-3 w-3" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
