/**
 * «Άκου με»: ανάλυση φωνής ΜΟΝΟ στη συσκευή (Web Audio), χωρίς τεχνητή νοημοσύνη και χωρίς αποστολή.
 * Δίνει ΕΝΔΕΙΞΕΙΣ (ακούστηκε φωνή, πόσο δυνατά, πόσες συλλαβές, αν το Σ «σφύριξε»).
 * ΔΕΝ βαθμολογεί την προφορά: την κρίση την κάνει ο ενήλικας (γονιός/θεραπευτής) μετά την ακρόαση.
 */

export interface VoiceFrame {
  /** ms από την αρχή */
  t: number;
  /** RMS 0..1 */
  rms: number;
  /** Ποσοστό ενέργειας πάνω από 4 kHz (0..1), για συριστικά (Σ, Ζ, Τσ). */
  hf: number;
}

export type LevelZone = 'silent' | 'quiet' | 'normal' | 'stage';

export interface TakeAnalysis {
  heard: boolean;
  voicedMs: number;
  /** Ένταση κορυφής σε dBFS (αρνητικός αριθμός· 0 = μέγιστο). */
  peakDb: number;
  /** Τυπική ένταση όσο ακουγόταν φωνή (dBFS). */
  typicalDb: number;
  zone: LevelZone;
  syllables: number;
  /** Μέσο ποσοστό υψηλών συχνοτήτων στα «φωνητικά» καρέ. */
  hfRatio: number;
}

export const toDb = (rms: number): number => (rms <= 1e-6 ? -120 : 20 * Math.log10(rms));

/** Ζώνες έντασης (κατά προσέγγιση· κάθε συσκευή διαφέρει, γι' αυτό είναι ένδειξη). */
export function levelZone(db: number): LevelZone {
  if (db < -50) return 'silent';
  if (db < -32) return 'quiet';
  if (db < -18) return 'normal';
  return 'stage';
}

export function rmsOf(samples: Float32Array): number {
  let s = 0;
  for (let i = 0; i < samples.length; i++) s += samples[i] * samples[i];
  return Math.sqrt(s / Math.max(1, samples.length));
}

/** Ποσοστό ενέργειας > cutoffHz από φάσμα σε dB (AnalyserNode.getFloatFrequencyData). */
export function highFreqRatio(spectrumDb: Float32Array, sampleRate: number, cutoffHz = 4000): number {
  const binHz = sampleRate / 2 / spectrumDb.length;
  let hi = 0;
  let all = 0;
  for (let i = 0; i < spectrumDb.length; i++) {
    const f = i * binHz;
    if (f < 300 || f > 11000) continue;
    const p = Math.pow(10, spectrumDb[i] / 10);
    all += p;
    if (f >= cutoffHz) hi += p;
  }
  return all > 0 ? hi / all : 0;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

export function analyzeTake(frames: VoiceFrame[]): TakeAnalysis {
  if (frames.length < 3) {
    return { heard: false, voicedMs: 0, peakDb: -120, typicalDb: -120, zone: 'silent', syllables: 0, hfRatio: 0 };
  }
  const step = frames.length > 1 ? (frames[frames.length - 1].t - frames[0].t) / (frames.length - 1) : 30;
  // Εξομάλυνση (~3 καρέ) για τον φάκελο έντασης
  const env = frames.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - 1); j <= Math.min(frames.length - 1, i + 1); j++) {
      s += frames[j].rms;
      n++;
    }
    return s / n;
  });
  const floor = percentile(env, 0.1);
  const threshold = Math.max(floor * 3, 0.006); // ≈ −44 dBFS
  const voiced = frames.filter((_, i) => env[i] > threshold);
  const voicedMs = voiced.length * step;
  const peak = Math.max(...env);
  const typical = percentile(voiced.map((f) => f.rms), 0.6);

  // Συλλαβές = «κορυφές» του φακέλου, με κοιλάδα ανάμεσα και ελάχιστη απόσταση 110 ms
  const minGap = Math.max(1, Math.round(110 / step));
  const peaks: number[] = [];
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] <= threshold || env[i] < env[i - 1] || env[i] < env[i + 1]) continue;
    const last = peaks[peaks.length - 1];
    if (last !== undefined) {
      let valley = Infinity;
      for (let j = last; j <= i; j++) valley = Math.min(valley, env[j]);
      const separated = valley < 0.65 * Math.min(env[last], env[i]) || valley < threshold;
      if (!separated || i - last < minGap) {
        if (env[i] > env[last]) peaks[peaks.length - 1] = i;
        continue;
      }
    }
    peaks.push(i);
  }
  const hfRatio = voiced.length ? voiced.reduce((s, f) => s + f.hf, 0) / voiced.length : 0;
  const heard = voicedMs >= 150;
  return {
    heard,
    voicedMs: Math.round(voicedMs),
    peakDb: Math.round(toDb(peak)),
    typicalDb: Math.round(toDb(typical)),
    zone: heard ? levelZone(toDb(typical)) : 'silent',
    syllables: heard ? peaks.length : 0,
    hfRatio: Math.round(hfRatio * 100) / 100,
  };
}

export const ZONE_LABEL_EL: Record<LevelZone, string> = {
  silent: 'σιωπή',
  quiet: 'ψίθυρος',
  normal: 'κανονική φωνή',
  stage: 'φωνή σκηνής',
};

export interface TakeFeedback {
  ok: boolean;
  lines: string[];
}

/** Φιλικά μηνύματα για το παιδί (ενδείξεις, όχι βαθμός). */
export function feedbackFor(
  a: TakeAnalysis,
  target: { syllables?: number; sibilant?: boolean; zone?: Exclude<LevelZone, 'silent'> }
): TakeFeedback {
  if (!a.heard) return { ok: false, lines: ['Δεν σε άκουσα καλά. Πλησίασε λίγο τη συσκευή και ξαναπές το.'] };
  const lines: string[] = ['👂 Σε άκουσα!'];
  let ok = true;
  if (target.syllables && target.syllables > 1) {
    const diff = Math.abs(a.syllables - target.syllables);
    if (diff <= 1) lines.push(`👏 Ακούστηκαν περίπου ${a.syllables} συλλαβές: ωραίος ρυθμός.`);
    else {
      ok = false;
      lines.push(
        a.syllables < target.syllables
          ? 'Κάποια κομμάτια ακούστηκαν μαζί. Πες το πιο αργά, συλλαβή συλλαβή.'
          : 'Ακούστηκαν περισσότερα κομμάτια. Πες το πιο ενωμένα.'
      );
    }
  }
  if (target.sibilant) {
    if (a.hfRatio >= 0.3) lines.push('🐍 Ακούστηκε καθαρό σφύριγμα.');
    else {
      ok = false;
      lines.push('Το σφύριγμα ακούστηκε απαλό. Φέρε τα δόντια πιο κοντά, γλώσσα πίσω από τα κάτω δόντια.');
    }
  }
  if (target.zone) {
    if (a.zone === target.zone) lines.push(`🎯 Ακριβώς: ${ZONE_LABEL_EL[a.zone]}.`);
    else {
      ok = false;
      const order: LevelZone[] = ['silent', 'quiet', 'normal', 'stage'];
      lines.push(
        order.indexOf(a.zone) < order.indexOf(target.zone)
          ? `Ακούστηκε ${ZONE_LABEL_EL[a.zone]}. Λίγο πιο δυνατά, για ${ZONE_LABEL_EL[target.zone]}.`
          : `Ακούστηκε ${ZONE_LABEL_EL[a.zone]}. Λίγο πιο σιγά, για ${ZONE_LABEL_EL[target.zone]}.`
      );
    }
  }
  return { ok, lines };
}
