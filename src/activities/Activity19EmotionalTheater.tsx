import React from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';

interface TheaterScene {
  sceneEmoji: string;
  titleEl: string;
  storyEl: string;
  theatricalPromptEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCalmSolution: boolean }>;
}

const THEATER_SCENES: TheaterScene[] = [
  {
    sceneEmoji: '🎭🧱',
    titleEl: 'Σκηνή 1: Ο Πύργος που Έπεσε',
    storyEl:
      'Χτίζεις έναν ψηλό πύργο με τουβλάκια και ξαφνικά πέφτει κάτω! Νιώθεις εκνευρισμό στο σώμα.',
    theatricalPromptEl:
      'Θεατρική Δράση: Κάνε πρώτα το «Άγαλμα της Έκπληξης» 😮, πάρε μια βαθιά ανάσα 🌬️ και διάλεξε τι θα πεις στον εαυτό σου:',
    options: [
      {
        id: 'th1-1',
        emoji: '🌬️🧱',
        labelEl: '«Δεν πειράζει! Παίρνω μια ανάσα και τον χτίζω ξανά με πιο γερή βάση!»',
        isCalmSolution: true,
      },
      {
        id: 'th1-2',
        emoji: '💢',
        labelEl: 'Πετάω τα τουβλάκια μακριά με θυμό',
        isCalmSolution: false,
      },
      {
        id: 'th1-3',
        emoji: '😭',
        labelEl: 'Φωνάζω δυνατά και τα παρατάω',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🛝',
    titleEl: 'Σκηνή 2: Η Σειρά στην Τσουλήθρα / στο Παιχνίδι',
    storyEl:
      'Είσαι στην αυλή και ένα άλλο παιδί βρίσκεται μπροστά σου. Θέλεις πολύ να παίξεις τώρα!',
    theatricalPromptEl:
      'Θεατρικός Ρόλος: Δείξε με τα χέρια σου την «Ήρεμη Υπομονή» 🤲 και διάλεξε την κοινωνική λύση:',
    options: [
      {
        id: 'th2-1',
        emoji: '👐',
        labelEl: 'Σπρώχνω για να περάσω πρώτος',
        isCalmSolution: false,
      },
      {
        id: 'th2-2',
        emoji: '🗣️🤝',
        labelEl: 'Περιμένω τη σειρά μου και λέω ευγενικά: «Μόλις τελειώσεις, είναι η σειρά μου!»',
        isCalmSolution: true,
      },
      {
        id: 'th2-3',
        emoji: '😠',
        labelEl: 'Θυμώνω και φεύγω τρέχοντας',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭✏️',
    titleEl: 'Σκηνή 3: Κάτι μου Φαίνεται Δύσκολο στην Τάξη',
    storyEl:
      'Βλέπεις μια άσκηση που φαίνεται μπερδεμένη και δεν ξέρεις από πού να ξεκινήσεις.',
    theatricalPromptEl:
      'Θεατρική Έκφραση: Σήκωσε ήρεμα το χέρι 🙋 και διάλεξε τη στρατηγική αυτορρύθμισης:',
    options: [
      {
        id: 'th3-1',
        emoji: '🙋💡',
        labelEl: 'Ζητάω ήρεμα βοήθεια και ξεκινάω από το 1ο μικρό βήμα!',
        isCalmSolution: true,
      },
      {
        id: 'th3-2',
        emoji: '📄💥',
        labelEl: 'Τσαλακώνω το χαρτί μου',
        isCalmSolution: false,
      },
      {
        id: 'th3-3',
        emoji: '🙈',
        labelEl: 'Κρύβομαι κάτω από το τραπέζι',
        isCalmSolution: false,
      },
    ],
  },
];

export const Activity19EmotionalTheater: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  adaptiveProfile,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const scene = THEATER_SCENES[(currentRound - 1) % THEATER_SCENES.length];

  const visibleOptions =
    hintLevel === 2
      ? scene.options.filter((o, i) => o.isCalmSolution || i === 0)
      : scene.options;

  const handleChooseSolution = (isCalmSolution: boolean) => {
    runDebounced(() => {
      if (isCalmSolution) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          'Στο Θέατρο της Αυτορρύθμισης ψάχνουμε τη λύση που κρατάει εμάς και τους φίλους μας ήρεμους και ασφαλείς!'
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-19-emotional-theater">
      <div className="p-6 rounded-3xl bg-terracotta-surface border-4 border-terracotta space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-charcoal border border-terracotta">
          🎭 Θεατρική Αγωγή • Παιδοψυχολογία • Κοινωνική Εργασία
        </span>
        <div className="text-5xl" aria-hidden="true">{scene.sceneEmoji}</div>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{scene.titleEl}</h2>
        <p className="text-base font-bold text-charcoal">{scene.storyEl}</p>
        <p className="text-sm font-extrabold text-slate-dark bg-white/90 p-3 rounded-2xl border border-charcoal/15">
          {scene.theatricalPromptEl}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleOptions.map((opt) => {
          const highlight =
            (hintLevel >= 1 || adaptiveProfile.autoHintBoost) && opt.isCalmSolution;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCalmSolution ? 'emotional-theater-target' : `theater-opt-${opt.id}`}
              onClick={() => handleChooseSolution(opt.isCalmSolution)}
              className={`touch-target min-h-[124px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-sm font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
