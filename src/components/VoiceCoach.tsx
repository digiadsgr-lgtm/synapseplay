import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { speakGreek } from '../utils/soundAndSpeech';
import { feedbackFor, levelZone, type LevelZone } from '../utils/voiceAnalysis';
import { ParentGateModal } from './ParentGateModal';

export type AdultRating = 'clear' | 'almost';

/**
 * «Άκου με»: πρότυπο φωνής → το παιδί το λέει → ακούει τον εαυτό του → ενδείξεις στη συσκευή →
 * ο ενήλικας κρίνει (✅ καθαρά / 🔁 σχεδόν). Η ηχογράφηση μένει μόνο στη μνήμη και σβήνει.
 */
export const VoiceCoach: React.FC<{
  modelText: string;
  target: { syllables?: number; sibilant?: boolean; zone?: Exclude<LevelZone, 'silent'> };
  onRate: (r: AdultRating) => void;
  rate?: number;
  resetKey: string;
}> = ({ modelText, target, onRate, rate = 0.85, resetKey }) => {
  const { settings, updateSettings } = useApp();
  const rec = useVoiceRecorder({ maxMs: 8000 });
  const [gate, setGate] = useState<boolean>(false);
  const [consent, setConsent] = useState<boolean>(false);
  const micOn = !!settings.micEnabled;

  useEffect(() => {
    rec.clearTake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const fb = rec.analysis ? feedbackFor(rec.analysis, target) : null;
  const liveZone = levelZone(rec.levelDb);
  const pct = Math.max(0, Math.min(100, ((rec.levelDb + 60) / 60) * 100));

  return (
    <div data-testid="voice-coach" className="p-4 rounded-2xl bg-white border-2 border-slate space-y-3 text-left">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="voice-model-btn"
          onClick={() => void speakGreek(modelText, true, rate, { force: true })}
          className="touch-target px-4 py-2.5 rounded-2xl bg-slate text-white font-extrabold"
        >
          🔊 Άκου πώς το λέω
        </button>
        {micOn && rec.state !== 'unsupported' && rec.state !== 'denied' && (
          rec.state === 'recording' ? (
            <button
              type="button"
              data-testid="voice-stop-btn"
              onClick={() => rec.stop()}
              className="touch-target px-4 py-2.5 rounded-2xl bg-terracotta-dark text-white font-extrabold"
            >
              ⏹ Τελείωσα
            </button>
          ) : (
            <button
              type="button"
              data-testid="voice-record-btn"
              disabled={rec.state === 'asking'}
              onClick={() => void rec.start()}
              className="touch-target px-4 py-2.5 rounded-2xl bg-terracotta text-white font-extrabold disabled:opacity-60"
            >
              🎙️ {rec.state === 'ready' ? 'Ξανά' : 'Πες το εσύ'}
            </button>
          )
        )}
        {!micOn && (
          <button
            type="button"
            data-testid="voice-enable-mic-btn"
            onClick={() => setGate(true)}
            className="touch-target px-3 py-2 rounded-2xl bg-white border-2 border-sand-dark text-xs font-bold"
          >
            🎙️ Άνοιγμα μικροφώνου (γονιός)
          </button>
        )}
      </div>

      {rec.state === 'recording' && (
        <div data-testid="voice-live-meter" aria-label={`Ένταση: ${liveZone}`} className="space-y-1">
          <div className="h-4 rounded-full bg-sand-light border border-sand-dark overflow-hidden">
            <div
              className={`h-full transition-all ${liveZone === 'stage' ? 'bg-terracotta' : liveZone === 'normal' ? 'bg-sage' : 'bg-slate-light'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs font-bold text-charcoal-muted">Σε ακούω… (σταματά μόνο του σε 8″)</p>
        </div>
      )}
      {rec.state === 'denied' && (
        <p className="text-xs font-bold text-terracotta-dark" data-testid="voice-denied">
          Το μικρόφωνο δεν επιτράπηκε σε αυτή τη συσκευή. Μπορείτε να συνεχίσετε χωρίς αυτό.
        </p>
      )}
      {rec.state === 'unsupported' && micOn && (
        <p className="text-xs text-charcoal-muted">Αυτή η συσκευή δεν δίνει μικρόφωνο στον browser. Συνεχίζουμε με το αυτί του γονιού.</p>
      )}

      {fb && (
        <div data-testid="voice-feedback" className={`p-3 rounded-xl text-sm font-bold ${fb.ok ? 'bg-sage-surface' : 'bg-sand-light'}`}>
          {fb.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {rec.playbackUrl && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs">Άκου τη φωνή σου:</span>
              <audio src={rec.playbackUrl} controls data-testid="voice-playback" className="h-9 max-w-full" />
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-sand-dark">
        <p className="text-xs font-extrabold text-charcoal-muted mb-1.5">Για τον μεγάλο: πώς ακούστηκε;</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="voice-rate-clear-btn"
            onClick={() => onRate('clear')}
            className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
          >
            ✅ Καθαρά, επόμενο
          </button>
          <button
            type="button"
            data-testid="voice-rate-almost-btn"
            onClick={() => {
              rec.clearTake();
              onRate('almost');
            }}
            className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-sand-dark text-sm font-bold"
          >
            🔁 Σχεδόν, ξανά
          </button>
        </div>
      </div>

      {gate && (
        <ParentGateModal
          onSuccess={() => {
            setGate(false);
            setConsent(true);
          }}
          onCancel={() => setGate(false)}
        />
      )}
      {consent && (
        <div role="dialog" aria-modal="true" data-testid="mic-consent" className="p-4 rounded-2xl bg-slate-surface border-2 border-slate space-y-2">
          <p className="text-sm font-extrabold text-charcoal">🎙️ Μικρόφωνο για τις ασκήσεις λόγου</p>
          <ul className="text-xs text-charcoal list-disc pl-5 space-y-1">
            <li>Η φωνή του παιδιού ακούγεται και αναλύεται <strong>μόνο σε αυτή τη συσκευή</strong>.</li>
            <li>Δεν αποθηκεύεται και δεν στέλνεται πουθενά· η ηχογράφηση σβήνει με την επόμενη.</li>
            <li>Οι ενδείξεις (ένταση, συλλαβές, «σφύριγμα») βοηθούν· την κρίση την κάνετε εσείς ή ο θεραπευτής.</li>
            <li>Κλείνει όποτε θέλετε από «Παιδιά & ρυθμίσεις».</li>
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="mic-consent-accept-btn"
              onClick={() => {
                void updateSettings({ micEnabled: true });
                setConsent(false);
              }}
              className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
            >
              Συμφωνώ, άνοιγμα
            </button>
            <button
              type="button"
              onClick={() => setConsent(false)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
            >
              Όχι τώρα
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCoach;
