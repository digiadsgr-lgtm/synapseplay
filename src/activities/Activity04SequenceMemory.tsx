import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface SymbolTile {
  id: string;
  emoji: string;
  labelEl: string;
  colorClass: string;
}

const TILES: SymbolTile[] = [
  { id: 'sun', emoji: '☀️', labelEl: 'Ήλιος', colorClass: 'border-terracotta bg-terracotta-surface' },
  { id: 'leaf', emoji: '🌿', labelEl: 'Φύλλο', colorClass: 'border-sage bg-sage-surface' },
  { id: 'wave', emoji: '🌊', labelEl: 'Κύμα', colorClass: 'border-slate bg-slate-surface' },
  { id: 'star', emoji: '⭐', labelEl: 'Αστέρι', colorClass: 'border-charcoal/40 bg-sand' },
];

const SEQUENCES: string[][] = [
  ['sun', 'leaf'],
  ['leaf', 'wave', 'sun'],
  ['wave', 'star', 'leaf'],
  ['star', 'sun'],
  ['sun', 'wave', 'star'],
  ['leaf', 'star', 'wave'],
  ['wave', 'leaf'],
  ['star', 'leaf', 'sun'],
  ['sun', 'star', 'wave'],
  ['leaf', 'sun', 'wave'],
  ['wave', 'sun', 'leaf'],
  ['star', 'wave', 'sun'],
  ['sun', 'leaf', 'star'],
  ['leaf', 'wave', 'star'],
  ['star', 'sun', 'leaf'],
];

export const Activity04SequenceMemory: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();

  const activeSequences = useMemo(
    () => selectSessionRounds(SEQUENCES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const baseSequence = activeSequences[(currentRound - 1) % activeSequences.length];

  // Calibrate sequence span by ageBand & live performance:
  // - 4-5 years: max 2 symbols
  // - 6-8 years: standard 2-3 symbols
  // - 10-12 years or Mastery challenge: +1 symbol (3-4 symbols)
  const targetSequence = useMemo(() => {
    if (ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      return baseSequence.slice(0, 2);
    }
    if (ageBand === '10-12' || adaptiveProfile.enrichChallenge) {
      const extraSymbol = baseSequence[0] === 'sun' ? 'star' : 'sun';
      return [...baseSequence, extraSymbol];
    }
    return baseSequence;
  }, [baseSequence, ageBand, adaptiveProfile.distractorReductionRatio, adaptiveProfile.enrichChallenge]);

  const [userProgress, setUserProgress] = useState<string[]>([]);
  const [activeFlashId, setActiveFlashId] = useState<string | null>(null);
  const [isDemonstrating, setIsDemonstrating] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);

  const clearDemoTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const playDemonstration = useCallback(() => {
    clearDemoTimers();
    setIsDemonstrating(true);
    setUserProgress([]);

    targetSequence.forEach((tileId, idx) => {
      const tileObj = TILES.find((t) => t.id === tileId);
      const tOn = window.setTimeout(() => {
        setActiveFlashId(tileId);
        playCalmTone('soft-step', settings.soundEnabled);
        if (tileObj) {
          speakGreek(tileObj.labelEl, settings.voiceEnabled, adaptiveProfile.speechRate);
        }
      }, idx * 450 + 100);

      const tOff = window.setTimeout(() => {
        setActiveFlashId(null);
        if (idx === targetSequence.length - 1) {
          setIsDemonstrating(false);
        }
      }, idx * 450 + 380);

      timersRef.current.push(tOn, tOff);
    });
  }, [targetSequence, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate, clearDemoTimers]);

  useEffect(() => {
    setUserProgress([]);
    playDemonstration();
    return () => clearDemoTimers();
  }, [currentRound, sessionSeed, playDemonstration, clearDemoTimers]);

  const nextExpectedTileId = targetSequence[userProgress.length];

  const handleTilePress = useCallback(
    (tileId: string) => {
      runDebounced(() => {
        // If child already saw the sequence and taps the correct first tile, stop demo timers gracefully
        if (isDemonstrating) {
          clearDemoTimers();
          setActiveFlashId(null);
          setIsDemonstrating(false);
        }

        if (tileId === nextExpectedTileId) {
          playCalmTone('soft-step', settings.soundEnabled);
          const updated = [...userProgress, tileId];
          setUserProgress(updated);
          if (updated.length === targetSequence.length) {
            advanceRound(getAbsorbedCount());
          }
        } else {
          // Non-punitive: no streak loss, reset current round sequence input gently
          setUserProgress([]);
          triggerGentleFeedback(
            'Δεν πειράζει! Ας ξεκινήσουμε τη σειρά αυτού του βήματος από την αρχή ήρεμα.'
          );
        }
      });
    },
    [
      runDebounced,
      isDemonstrating,
      clearDemoTimers,
      nextExpectedTileId,
      settings.soundEnabled,
      userProgress,
      targetSequence.length,
      advanceRound,
      getAbsorbedCount,
      triggerGentleFeedback,
    ]
  );

  // Keyboard number-key support (1-4)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < TILES.length) {
        handleTilePress(TILES[idx].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTilePress]);

  return (
    <div className="space-y-6" data-testid="activity-04-sequence-memory">
      {/* Sequence Status Bar & Replay Button */}
      <div className="p-4 rounded-2xl bg-white border-2 border-sand-dark flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-charcoal">Σειρά ({targetSequence.length} σύμβολα):</span>
          <div className="flex items-center gap-2">
            {targetSequence.map((tileId, idx) => {
              const tile = TILES.find((t) => t.id === tileId)!;
              const isEntered = idx < userProgress.length;
              const showCue =
                isEntered ||
                hintLevel >= 2 ||
                ageBand === '4-5' ||
                ((hintLevel === 1 || adaptiveProfile.autoHintBoost) && idx === 0);
              return (
                <div
                  key={`${tileId}-${idx}`}
                  data-testid={`sequence-slot-${idx}`}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${
                    isEntered
                      ? 'bg-sage text-white border-sage-dark'
                      : 'bg-sand border-sand-dark text-charcoal'
                  }`}
                >
                  {showCue ? tile.emoji : `${idx + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={playDemonstration}
          data-testid="replay-sequence-btn"
          className="touch-target px-4 py-2 rounded-2xl bg-slate-surface border-2 border-slate text-charcoal font-bold flex items-center gap-2 hover:bg-slate hover:text-white"
        >
          <span aria-hidden="true">🔄</span>
          <span>Δείξε ξανά τη σειρά</span>
        </button>
      </div>

      {/* 4 Calming Simon Tiles */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {TILES.map((tile, idx) => {
          const isFlashing = activeFlashId === tile.id;
          const isHintHighlighted =
            !isDemonstrating && hintLevel >= 1 && nextExpectedTileId === tile.id;

          return (
            <button
              key={tile.id}
              type="button"
              data-testid={`sequence-tile-${tile.id}`}
              onClick={() => handleTilePress(tile.id)}
              aria-label={`${idx + 1}. ${tile.labelEl}`}
              className={`touch-target min-h-[120px] p-6 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                isFlashing
                  ? 'bg-sage text-white border-charcoal scale-[1.03] shadow-lg'
                  : isHintHighlighted
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : `${tile.colorClass} hover:opacity-90`
              }`}
            >
              <span className="text-5xl select-none" aria-hidden="true">
                {tile.emoji}
              </span>
              <span className="text-lg font-extrabold">{tile.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
