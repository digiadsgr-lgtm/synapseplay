import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeTake, highFreqRatio, rmsOf, toDb, type TakeAnalysis, type VoiceFrame } from '../utils/voiceAnalysis';

export type RecorderState = 'idle' | 'asking' | 'recording' | 'ready' | 'denied' | 'unsupported';

/**
 * Μικρόφωνο → ηχογράφηση ΜΟΝΟ στη μνήμη της καρτέλας + ανάλυση στη συσκευή.
 * Τίποτα δεν αποθηκεύεται και τίποτα δεν στέλνεται. Η ηχογράφηση σβήνει με την επόμενη ή όταν κλείσει η οθόνη.
 */
export function useVoiceRecorder(opts: { maxMs?: number } = {}) {
  const maxMs = opts.maxMs ?? 8000;
  const [state, setState] = useState<RecorderState>(() =>
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'idle' : 'unsupported'
  );
  const [levelDb, setLevelDb] = useState<number>(-120);
  const [analysis, setAnalysis] = useState<TakeAnalysis | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const framesRef = useRef<VoiceFrame[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);

  const release = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    timerRef.current = null;
    stopTimerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
  }, []);

  const clearTake = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPlaybackUrl(null);
    setAnalysis(null);
  }, []);

  const finish = useCallback(() => {
    if (state !== 'recording' && !timerRef.current) return;
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          urlRef.current = URL.createObjectURL(blob);
          setPlaybackUrl(urlRef.current);
        }
        chunksRef.current = [];
      };
      rec.stop();
    }
    recRef.current = null;
    release();
    setLevelDb(-120);
    setAnalysis(analyzeTake(framesRef.current));
    setState('ready');
  }, [release, state]);

  const start = useCallback(async () => {
    clearTake();
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
      setState('unsupported');
      return;
    }
    setState('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const time = new Float32Array(analyser.fftSize);
      const freq = new Float32Array(analyser.frequencyBinCount);
      framesRef.current = [];
      const t0 = performance.now();
      timerRef.current = window.setInterval(() => {
        analyser.getFloatTimeDomainData(time);
        analyser.getFloatFrequencyData(freq);
        const rms = rmsOf(time);
        framesRef.current.push({ t: performance.now() - t0, rms, hf: highFreqRatio(freq, ctx.sampleRate) });
        setLevelDb(toDb(rms));
      }, 30);
      if (typeof MediaRecorder !== 'undefined') {
        const rec = new MediaRecorder(stream);
        chunksRef.current = [];
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
        rec.start();
        recRef.current = rec;
      }
      setState('recording');
      stopTimerRef.current = window.setTimeout(() => finishRef.current(), maxMs);
    } catch {
      release();
      setState('denied');
    }
  }, [clearTake, maxMs, release]);

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(
    () => () => {
      release();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [release]
  );

  return { state, levelDb, analysis, playbackUrl, start, stop: finish, clearTake };
}
