import React, { useMemo, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

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
    titleEl: 'Σκηνή: Ο Πύργος που Έπεσε',
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
    titleEl: 'Σκηνή: Η Σειρά στην Τσουλήθρα',
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
    titleEl: 'Σκηνή: Κάτι μου Φαίνεται Δύσκολο στην Τάξη',
    storyEl:
      'Βλέπεις μια άσκηση που φαίνεται μπερδεμένη και δεν ξέρεις από πού να ξεκινήσεις.',
    theatricalPromptEl:
      'Θεατρική Έκφραση: Σήκωσε ήρεμα το χέρι 🙋 και διάλεξε τη στρατηγική αυτορρύθμισης:',
    options: [
      {
        id: 'th3-1',
        emoji: '🙋💡',
        labelEl: 'Ζητάω ήρεμα βοήθεια και ξεκινάω από το πρώτο μικρό βήμα!',
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
  {
    sceneEmoji: '🎭🎲',
    titleEl: 'Σκηνή: Χάνω σε ένα Επιτραπέζιο Παιχνίδι',
    storyEl:
      'Παίζεις με τους φίλους σου ένα επιτραπέζιο και κάποιος άλλος κερδίζει στον γύρο.',
    theatricalPromptEl:
      'Θεατρικός Ρόλος: Χαμογέλασε ευγενικά 😊, δώσε το χέρι και διάλεξε τη θετική σκέψη:',
    options: [
      {
        id: 'th4-1',
        emoji: '🤝🌟',
        labelEl: 'Λέω «Μπράβο, ωραίο παιχνίδι! Πάμε άλλον έναν γύρο όλοι μαζί!»',
        isCalmSolution: true,
      },
      {
        id: 'th4-2',
        emoji: '🌪️',
        labelEl: 'Χαλάω το ταμπλό του παιχνιδιού',
        isCalmSolution: false,
      },
      {
        id: 'th4-3',
        emoji: '😤',
        labelEl: 'Φωνάζω ότι δεν θα ξαναπαίξω ποτέ',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🔊',
    titleEl: 'Σκηνή: Δυνατός Θόρυβος στο Δωμάτιο',
    storyEl:
      'Ξαφνικά ακούγεται πολλή φασαρία γύρω σου και νιώθεις τα αυτιά και το κεφάλι σου να κουράζονται.',
    theatricalPromptEl:
      'Θεατρική Δράση: Κάνε το «Ήρεμο Καβούκι» 🐢, πάρε αργή εκπνοή και διάλεξε τι θα κάνεις:',
    options: [
      {
        id: 'th5-1',
        emoji: '🎧🌿',
        labelEl: 'Ζητάω ήρεμα μια ήσυχη γωνιά για 2 λεπτά να ξεκουραστώ',
        isCalmSolution: true,
      },
      {
        id: 'th5-2',
        emoji: '📢',
        labelEl: 'Φωνάζω ακόμα πιο δυνατά από τους άλλους',
        isCalmSolution: false,
      },
      {
        id: 'th5-3',
        emoji: '🏃‍♂️',
        labelEl: 'Σπρώχνω τις καρέκλες',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🎨',
    titleEl: 'Σκηνή: Μοιραζόμαστε τους Μαρκαδόρους',
    storyEl:
      'Ο διπλανός σου θέλει τον μπλε μαρκαδόρο την ίδια στιγμή που τον κρατάς κι εσύ.',
    theatricalPromptEl:
      'Θεατρική Έκφραση: Άνοιξε φιλικά την παλάμη 🖐️ και διάλεξε τη συνεργατική λύση:',
    options: [
      {
        id: 'th6-1',
        emoji: '🎨🤝',
        labelEl: '«Βάφω αυτό το συννεφάκι σε 1 λεπτό και σου τον δίνω αμέσως!»',
        isCalmSolution: true,
      },
      {
        id: 'th6-2',
        emoji: '✊',
        labelEl: 'Κρύβω όλους τους μαρκαδόρους στην τσάντα μου',
        isCalmSolution: false,
      },
      {
        id: 'th6-3',
        emoji: '😠',
        labelEl: 'Τραβάω απότομα το χαρτί του',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🔄',
    titleEl: 'Σκηνή: Αλλαγή Σχεδίου λόγω Βροχής',
    storyEl:
      'Είχατε κανονίσει να πάτε στην παιδική χαρά, αλλά ξαφνικά έπιασε δυνατή βροχή και πρέπει να μείνετε σπίτι.',
    theatricalPromptEl:
      'Θεατρική Δράση: Κάνε τους «Χαλαρούς Ώμους» 🤷‍♂️, πάρε βαθιά ανάσα και διάλεξε την ευέλικτη σκέψη:',
    options: [
      {
        id: 'th7-1',
        emoji: '🏕️🎲',
        labelEl: '«Κρίμα που βρέχει, αλλά μπορούμε να φτιάξουμε μια ωραία σκηνή με μαξιλάρια στο σαλόνι!»',
        isCalmSolution: true,
      },
      {
        id: 'th7-2',
        emoji: '🚪💥',
        labelEl: 'Χτυπάω την πόρτα με τις γροθιές μου',
        isCalmSolution: false,
      },
      {
        id: 'th7-3',
        emoji: '😭',
        labelEl: 'Φωνάζω ασταμάτητα ότι χάλασε όλη η μέρα',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🗣️',
    titleEl: 'Σκηνή: Θέλω Πολύ να Πω την Ιδέα μου!',
    storyEl:
      'Η δασκάλα ή ο γονιός μιλάει και εσένα σου έρχεται μια τέλεια ιδέα που φοβάσαι μήπως την ξεχάσεις!',
    theatricalPromptEl:
      'Θεατρικός Ρόλος: «Κλείδωσε» απαλά την ιδέα στην παλάμη σου 🤚 και διάλεξε τι θα κάνεις:',
    options: [
      {
        id: 'th8-1',
        emoji: '🙋‍♂️💭',
        labelEl: 'Κρατάω την ιδέα στο μυαλό μου, σηκώνω ήρεμα το χέρι και περιμένω να τελειώσει ο άλλος!',
        isCalmSolution: true,
      },
      {
        id: 'th8-2',
        emoji: '📢',
        labelEl: 'Διακόπτω φωνάζοντας δυνατά πάνω από τους άλλους',
        isCalmSolution: false,
      },
      {
        id: 'th8-3',
        emoji: '😤',
        labelEl: 'Τραβάω το μανίκι του άλλου επίμονα',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭⚽',
    titleEl: 'Σκηνή: Κατά Λάθος Σκόνταψε Πάνω μου',
    storyEl:
      'Στο διάλειμμα ένας συμμαθητής τρέχει, σκοντάφτει κατά λάθος πάνω σου και σου πέφτει το παγούρι.',
    theatricalPromptEl:
      'Θεατρική Έκφραση: Βάλε το χέρι στην καρδιά 💛, πάρε μια ανάσα και σκέψου σαν ντετέκτιβ:',
    options: [
      {
        id: 'th9-1',
        emoji: '🤝💬',
        labelEl: 'Καταλαβαίνω ότι έγινε κατά λάθος και λέω ήρεμα: «Δεν πειράζει, πρόσεχε μη χτυπήσεις!»',
        isCalmSolution: true,
      },
      {
        id: 'th9-2',
        emoji: '💢',
        labelEl: 'Τον σπρώχνω πίσω με δύναμη',
        isCalmSolution: false,
      },
      {
        id: 'th9-3',
        emoji: '😠',
        labelEl: 'Πετάω την μπάλα του μακριά',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🧸',
    titleEl: 'Σκηνή: Το Μικρό Αδερφάκι Πήρε το Παιχνίδι μου',
    storyEl:
      'Το μικρό σου αδερφάκι ή ένας φίλος πήρε το αγαπημένο σου αυτοκινητάκι χωρίς να σε ρωτήσει.',
    theatricalPromptEl:
      'Θεατρικός Ρόλος: Μίλησε με τη «Φωνή του Σοφού Αρχηγού» 🦉 και διάλεξε τη λύση:',
    options: [
      {
        id: 'th10-1',
        emoji: '🔄🧸',
        labelEl: 'Του προτείνω ήρεμα: «Με αυτό παίζω τώρα, έλα να σου δώσω αυτό το ωραίο φορτηγό!»',
        isCalmSolution: true,
      },
      {
        id: 'th10-2',
        emoji: '✊',
        labelEl: 'Του το αρπάζω απότομα από τα χέρια',
        isCalmSolution: false,
      },
      {
        id: 'th10-3',
        emoji: '😭',
        labelEl: 'Ουρλιάζω και χτυπάω τα πόδια στο πάτωμα',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🧽',
    titleEl: 'Σκηνή: Έκανα Λάθος στη Ζωγραφιά μου',
    storyEl:
      'Ζωγραφίζεις προσεκτικά έναν ήλιο και η γραμμή βγαίνει λίγο έξω από το περίγραμμα.',
    theatricalPromptEl:
      'Θεατρική Δράση: Χαμογέλασε δημιουργικά 🎨 και διάλεξε τι θα πεις στον εαυτό σου:',
    options: [
      {
        id: 'th11-1',
        emoji: '🌈✨',
        labelEl: '«Κάθε λάθος μπορεί να γίνει μια νέα ιδέα! Θα το κάνω μια μεγάλη φωτεινή ακτίνα!»',
        isCalmSolution: true,
      },
      {
        id: 'th11-2',
        emoji: '📄💥',
        labelEl: 'Σκίζω όλο το μπλοκ ζωγραφικής',
        isCalmSolution: false,
      },
      {
        id: 'th11-3',
        emoji: '🖍️',
        labelEl: 'Πετάω τους μαρκαδόρους κάτω',
        isCalmSolution: false,
      },
    ],
  },
  {
    sceneEmoji: '🎭🌅',
    titleEl: 'Σκηνή: Ώρα να Κλείσει η Οθόνη (Smooth Landing)',
    storyEl:
      'Ο Δακτύλιος Ομαλής Αποσύνδεσης δείχνει ότι το παιχνίδι ολοκληρώθηκε και το ζωάκι πάει για ύπνο.',
    theatricalPromptEl:
      'Θεατρική Δράση: Κάνε ένα μεγάλο τέντωμα πρωταθλητή 🙆‍♂️ και διάλεξε πώς κλείνουμε:',
    options: [
      {
        id: 'th12-1',
        emoji: '🌿💧',
        labelEl: 'Αφήνω ήρεμα το τάμπλετ, τεντώνομαι και πηγαίνω να πιω μια γουλιά νερό!',
        isCalmSolution: true,
      },
      {
        id: 'th12-2',
        emoji: '😤',
        labelEl: 'Κρύβω τη συσκευή και αρνούμαι να σταματήσω',
        isCalmSolution: false,
      },
      {
        id: 'th12-3',
        emoji: '😭',
        labelEl: 'Φωνάζω και κλαίω δυνατά',
        isCalmSolution: false,
      },
    ],
  },
];

export const Activity19EmotionalTheater: React.FC<ActivityRunnerRenderProps> = ({
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
  const activeScenes = useMemo(
    () => selectSessionRounds(THEATER_SCENES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const scene = activeScenes[(currentRound - 1) % activeScenes.length];

  useEffect(() => {
    speakGreek(
      `${scene.titleEl}. ${scene.storyEl}`,
      settings.voiceEnabled,
      adaptiveProfile.speechRate
    );
  }, [currentRound, sessionSeed, scene.titleEl, scene.storyEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const visibleOptions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? scene.options.filter((o, i) => o.isCalmSolution || i === 0)
        : scene.options;
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [scene.options, hintLevel, ageBand, adaptiveProfile.distractorReductionRatio, sessionSeed, currentRound]);

  const handleChooseSolution = (isCalmSolution: boolean) => {
    runDebounced(() => {
      if (isCalmSolution) {
        playCalmTone('complete', settings.soundEnabled);
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
