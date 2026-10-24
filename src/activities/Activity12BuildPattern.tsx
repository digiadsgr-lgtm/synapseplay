import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

type BlockColor = 'sage' | 'slate' | 'terracotta';

interface BlockDef {
  id: BlockColor;
  labelEl: string;
  emoji: string;
  bgClass: string;
}

const PALETTE: BlockDef[] = [
  { id: 'sage', labelEl: 'Πράσινο Τουβλάκι', emoji: '🟩', bgClass: 'bg-sage text-white border-sage-dark' },
  { id: 'slate', labelEl: 'Μπλε Τουβλάκι', emoji: '🟦', bgClass: 'bg-slate text-white border-slate-dark' },
  {
    id: 'terracotta',
    labelEl: 'Κεραμιδί Τουβλάκι',
    emoji: '🟧',
    bgClass: 'bg-terracotta text-white border-terracotta-dark',
  },
];

const PATTERNS: BlockColor[][] = [
  ['sage', 'slate', 'sage'],
  ['terracotta', 'sage', 'slate'],
  ['slate', 'terracotta', 'slate'],
  ['sage', 'terracotta', 'sage'],
  ['slate', 'sage', 'terracotta'],
  ['terracotta', 'slate', 'terracotta'],
  ['sage', 'sage', 'slate'],
  ['slate', 'slate', 'terracotta'],
  ['terracotta', 'sage', 'terracotta'],
];

export const Activity12BuildPattern: React.FC<ActivityRunnerRenderProps> = ({
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
  const activePatterns = useMemo(
    () => selectSessionRounds(PATTERNS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const basePattern = activePatterns[(currentRound - 1) % activePatterns.length];

  // Calibrate pattern length by ageBand & live performance:
  // - 4-5 years: 2 blocks
  // - 6-8 years: 3 blocks
  // - 10-12 years or Mastery challenge: 4 blocks
  const targetPattern = useMemo(() => {
    if (ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      return basePattern.slice(0, 2);
    }
    if (ageBand === '10-12' || adaptiveProfile.enrichChallenge) {
      return [...basePattern, basePattern[0]];
    }
    return basePattern;
  }, [basePattern, ageBand, adaptiveProfile.distractorReductionRatio, adaptiveProfile.enrichChallenge]);

  const [builtBlocks, setBuiltBlocks] = useState<BlockColor[]>([]);

  useEffect(() => {
    if (hintLevel === 2) {
      setBuiltBlocks(targetPattern.slice(0, targetPattern.length - 1));
    } else {
      setBuiltBlocks([]);
    }
  }, [currentRound, hintLevel, targetPattern, sessionSeed]);

  const nextExpectedColor = targetPattern[builtBlocks.length];

  const handleAddBlock = (color: BlockColor) => {
    runDebounced(() => {
      if (color === nextExpectedColor) {
        const next = [...builtBlocks, color];
        setBuiltBlocks(next);
        const placedBlock = PALETTE.find((b) => b.id === color);
        if (next.length === targetPattern.length) {
          playCalmTone('complete', settings.soundEnabled);
          advanceRound(getAbsorbedCount());
        } else {
          playCalmTone('soft-step', settings.soundEnabled);
          if (placedBlock) {
            speakGreek(placedBlock.labelEl, settings.voiceEnabled, adaptiveProfile.speechRate);
          }
        }
      } else {
        const expectedBlock = PALETTE.find((b) => b.id === nextExpectedColor)!;
        triggerGentleFeedback(
          `Στο σημείο ${builtBlocks.length + 1} του σχεδίου χρειαζόμαστε «${expectedBlock.labelEl}»!`
        );
      }
    });
  };

  const handlePhysicalComplete = () => {
    runDebounced(() => {
      playCalmTone('complete', settings.soundEnabled);
      advanceRound(getAbsorbedCount());
    });
  };

  return (
    <div className="space-y-6" data-testid="activity-12-build-pattern">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Target Pattern Blueprint */}
        <div className="p-5 rounded-3xl bg-white border-2 border-sand-dark space-y-3 text-center">
          <h2 className="text-lg font-extrabold text-charcoal">Πρότυπο Μοτίβο</h2>
          <div className="flex items-center justify-center gap-3">
            {targetPattern.map((c, idx) => {
              const block = PALETTE.find((b) => b.id === c)!;
              return (
                <div
                  key={`target-${idx}`}
                  className={`w-20 h-20 rounded-2xl border-4 flex flex-col items-center justify-center ${block.bgClass}`}
                >
                  <span className="text-2xl" aria-hidden="true">{block.emoji}</span>
                  <span className="text-xs font-extrabold">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Child's Construction Zone */}
        <div className="p-5 rounded-3xl bg-sage-surface border-2 border-sage space-y-3 text-center">
          <h2 className="text-lg font-extrabold text-charcoal">Η Κατασκευή μου</h2>
          <div className="flex items-center justify-center gap-3">
            {targetPattern.map((_, idx) => {
              const placed = builtBlocks[idx];
              const block = placed ? PALETTE.find((b) => b.id === placed) : undefined;
              return (
                <div
                  key={`built-${idx}`}
                  data-testid={`pattern-slot-${idx}`}
                  className={`w-20 h-20 rounded-2xl border-4 flex flex-col items-center justify-center ${
                    block ? block.bgClass : 'bg-white border-dashed border-slate text-charcoal-muted'
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {block ? block.emoji : '➕'}
                  </span>
                  <span className="text-xs font-extrabold">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block Picker Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {PALETTE.map((block) => {
          const highlight = hintLevel >= 1 && block.id === nextExpectedColor;
          return (
            <button
              key={block.id}
              type="button"
              data-testid={`pattern-picker-${block.id}`}
              onClick={() => handleAddBlock(block.id)}
              className={`touch-target px-5 py-3 rounded-2xl border-4 font-extrabold flex items-center gap-2 ${
                highlight
                  ? `${block.bgClass} ring-4 ring-charcoal/40 scale-105`
                  : `${block.bgClass} hover:opacity-90`
              }`}
            >
              <span className="text-2xl" aria-hidden="true">{block.emoji}</span>
              <span>{block.labelEl}</span>
            </button>
          );
        })}
      </div>

      {/* Physical LEGO/Blocks Bridge Option */}
      <div className="text-center pt-2">
        <button
          type="button"
          data-testid="pattern-physical-lego-btn"
          onClick={handlePhysicalComplete}
          className="touch-target px-5 py-2.5 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold text-sm inline-flex items-center gap-2 hover:bg-slate-surface"
        >
          <span aria-hidden="true">🧱</span>
          <span>Το έφτιαξα με τα αληθινά μου τουβλάκια!</span>
        </button>
      </div>
    </div>
  );
};
