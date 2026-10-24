import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { INTERDISCIPLINARY_PROTOCOLS } from '../data/interdisciplinaryProtocols';
import { evaluateInvisibleScenario } from '../utils/adaptiveScenarioEngine';
import { normalizeGreekForSpeech } from '../utils/soundAndSpeech';
import {
  CLINICAL_STUDIES_AND_TRIALS,
  getAgeAndPerformanceDifficulty,
} from '../utils/clinicalAdhdEngine';
import {
  createDefaultChildProfile,
  trainChildProfileOnActivityCompletion,
} from '../utils/childProfileLearningEngine';
import {
  ENABLE_PAYWALL,
  FAMILY_PLAN_LIMIT_NOTICE_EL,
  checkProfileCreationPermission,
  resolveEffectiveLicenseState,
  validateAndParseLicenseKey,
} from '../utils/licensingEngine';
import { formatFeedbackReportText } from '../components/ClinicalFeedbackSection';
import { saveSettings, wipeAllLocalData } from '../db/database';

function renderRoute(route: string = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe('Comprehensive Enrichment Suite (A-ST): Dynamic Gate, Age Adaptation, 8 Disciplines, Invisible Scenarios, Speech & OT Games', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('Requirement A: Parent Gate rotates dynamically on wrong answer or manual refresh so children cannot memorize a single answer', () => {
    renderRoute('/parent');

    const questionEl = screen.getByTestId('parent-gate-question');
    const firstQuestionText = questionEl.textContent;

    // Clicking a wrong answer immediately changes the arithmetic question!
    fireEvent.click(screen.getByTestId('parent-gate-option-12'));
    expect(screen.getByTestId('parent-gate-question').textContent).not.toBe(firstQuestionText);

    const secondQuestionText = screen.getByTestId('parent-gate-question').textContent;

    // Manual refresh button also rotates to a new question
    fireEvent.click(screen.getByTestId('parent-gate-refresh-btn'));
    expect(screen.getByTestId('parent-gate-question').textContent).not.toBe(secondQuestionText);
  });

  it('Requirement B: Adapts activity grid size and vocabulary dynamically across Age Bands (4-5 vs 6-8 vs 10-12)', async () => {
    // 1. Age 4-5: Visual Search displays only 3 large items (clean background, zero clutter)
    await saveSettings({ ageBand: '4-5' });
    const { unmount: unmount45 } = renderRoute('/activity/01-visual-search');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute('data-age-band', '4-5');
    });
    expect(screen.getByTestId('visual-search-grid').children).toHaveLength(3);
    unmount45();

    // 2. Age 10-12: Speech Articulation serves 4-syllable compound words (Πο-δή-λα-το)
    await saveSettings({ ageBand: '10-12' });
    renderRoute('/activity/13-speech-articulation');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
        'data-age-band',
        '10-12'
      );
    });
    expect(screen.getByTestId('activity-13-speech-articulation')).toHaveTextContent('Πο-δή-λα-το');
  });

  it('Requirement C: Renders all 8 Interdisciplinary Protocols (OT, Physiatry, SLT, Psychology, Psychiatry, Social Work, Music-Kinetic, Theater) in Parent Dashboard', async () => {
    expect(INTERDISCIPLINARY_PROTOCOLS).toHaveLength(8);

    renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('interdisciplinary-protocols-section')).toBeInTheDocument();
    });

    for (const proto of INTERDISCIPLINARY_PROTOCOLS) {
      expect(screen.getByTestId(`discipline-card-${proto.id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('invisible-adaptive-engine-section')).toBeInTheDocument();
  });

  it('Requirement D: Invisible Adaptive Scenario Engine classifies child interaction telemetry into distinct silent adaptation profiles', () => {
    // 1. Frustration recovery when >= 2 gentle nudges occur
    const frustration = evaluateInvisibleScenario({
      ageBand: '6-8',
      completedRoundsCount: 0,
      gentleNudgesInCurrentActivity: 2,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 2500,
      seatedModeActive: false,
    });
    expect(frustration.scenarioId).toBe('SCENARIO_FRUSTRATION_RECOVERY');
    expect(frustration.autoHintBoost).toBe(true);
    expect(frustration.distractorReductionRatio).toBe(0.5);

    // 2. Impulsive rapid responder when absorbed double-taps >= 2
    const impulsive = evaluateInvisibleScenario({
      ageBand: '6-8',
      completedRoundsCount: 1,
      gentleNudgesInCurrentActivity: 0,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 3,
      lastResponseTimeMs: 450,
      seatedModeActive: false,
    });
    expect(impulsive.scenarioId).toBe('SCENARIO_IMPULSIVE_RAPID');
    expect(impulsive.preActionCalmDelayMs).toBeGreaterThan(0);

    // 3. Mastery challenge when completing rounds with zero nudges/hints
    const mastery = evaluateInvisibleScenario({
      ageBand: '8-10',
      completedRoundsCount: 2,
      gentleNudgesInCurrentActivity: 0,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 2000,
      seatedModeActive: false,
    });
    expect(mastery.scenarioId).toBe('SCENARIO_MASTERY_CHALLENGE');
    expect(mastery.enrichChallenge).toBe(true);
  });

  it('Requirement E (Speech Therapy Games 13, 14, 15): completes Phonological Syllables, Narrative Builder & Auditory Discrimination', () => {
    vi.useFakeTimers();

    // Activity 13: Speech Articulation & Syllables
    const { unmount: u13 } = renderRoute('/activity/13-speech-articulation');
    for (let r = 1; r <= 3; r++) {
      // Use Hint Level 2 to auto-clap syllables and complete
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('speech-articulation-target'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u13();

    // Activity 14: Narrative Builder (Who + Where + What)
    const { unmount: u14 } = renderRoute('/activity/14-narrative-builder');
    for (let r = 1; r <= 3; r++) {
      fireEvent.click(screen.getByTestId('narrative-who-card'));
      fireEvent.click(screen.getByTestId('narrative-where-card'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('narrative-action-target'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u14();

    // Activity 15: Auditory Discrimination & Spatial Concepts
    const { unmount: u15 } = renderRoute('/activity/15-auditory-discrimination');
    for (let r = 1; r <= 3; r++) {
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('auditory-discrimination-target'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u15();

    vi.useRealTimers();
  });

  it('Requirement ST & C (OT, Physiatry, Theater & Music-Kinetic Games 16, 17, 18, 19, 20): completes all 5 specialized activities', () => {
    vi.useFakeTimers();

    // Activity 16: OT Fine Motor & Graphomotor Tracing
    const { unmount: u16 } = renderRoute('/activity/16-ergo-fine-motor');
    for (let r = 1; r <= 3; r++) {
      for (let wp = 1; wp <= 3; wp++) {
        vi.advanceTimersByTime(450);
        fireEvent.click(screen.getByTestId(`fine-motor-waypoint-${wp}`));
      }
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u16();

    // Activity 17: Sensory Integration & Physiatry Postural Grounding
    const { unmount: u17 } = renderRoute('/activity/17-sensory-proprioception');
    for (let r = 1; r <= 3; r++) {
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('proprioception-pulse-btn'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u17();

    // Activity 18: OT Daily Living Skills & Praxis
    const { unmount: u18 } = renderRoute('/activity/18-adl-praxis');
    for (let r = 1; r <= 3; r++) {
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('adl-praxis-target'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u18();

    // Activity 19: Emotional Theater & Social Stories
    const { unmount: u19 } = renderRoute('/activity/19-emotional-theater');
    for (let r = 1; r <= 3; r++) {
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('emotional-theater-target'));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u19();

    // Activity 20: Music-Kinetic Tempo & Body Percussion
    const { unmount: u20 } = renderRoute('/activity/20-music-kinetic-rhythm');
    const roundMoves: Array<'rest' | 'knees'> = ['rest', 'knees', 'knees'];
    for (let r = 0; r < 3; r++) {
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId(`music-kinetic-btn-${roundMoves[r]}`));
    }
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    u20();

    vi.useRealTimers();
  });

  it('Greek Speech & Prosody Engine: normalizes ΚΟΤΑ, «ΚΟ - ΤΑ», Κοτα, syllables and phonemes into natural accented Greek (zero letter-by-letter spelling)', () => {
    const rawSentence =
      'Άκου προσεκτικά τη λέξη: «ΚΟ - ΤΑ». Ποια εικόνα δείχνει την ΚΟΤΑ (όχι την ΠΟΡΤΑ); 🐔';
    const normalized = normalizeGreekForSpeech(rawSentence);

    expect(normalized).toContain('κότα');
    expect(normalized).toContain('πόρτα');
    expect(normalized).not.toContain('ΚΟΤΑ');
    expect(normalized).not.toContain('ΚΟ - ΤΑ');
    expect(normalized).not.toContain('🐔');

    // Title-case unaccented "Κοτα" also normalizes to accented "κότα"
    expect(normalizeGreekForSpeech('Η λέξη Κοτα')).toContain('κότα');

    // Hyphenated syllables normalize to fluent words
    expect(normalizeGreekForSpeech('Χτύπα «ΜΠΑ - ΛΑ» και «ΧΕ-ΛΩ-ΝΑ»')).toContain('μπάλα');
    expect(normalizeGreekForSpeech('Χτύπα «ΜΠΑ - ΛΑ» και «ΧΕ-ΛΩ-ΝΑ»')).toContain('χελώνα');
  });

  it('Dynamic Variety & Clinical RCT Engine: rotates game scenarios on shuffle/replay and renders clinical trials in Parent Dashboard', async () => {
    const { unmount } = renderRoute('/activity/01-visual-search');

    // Inner-speech coaching cue (Meichenbaum CBT / Barkley) is active
    expect(screen.getByTestId('inner-speech-cue-pill')).toBeInTheDocument();

    const firstTarget = screen.getByTestId('visual-search-target-badge').textContent;
    expect(firstTarget).toContain('Πράσινη Χελώνα');

    // Clicking "Νέα Παραλλαγή" rotates to a brand-new set of items from the expanded pool
    fireEvent.click(screen.getByTestId('shuffle-variation-btn'));
    const nextTarget = screen.getByTestId('visual-search-target-badge').textContent;
    expect(nextTarget).not.toBe(firstTarget);
    expect(nextTarget).toContain('Σοφή Κουκουβάγια');
    unmount();

    // Verify Clinical Studies & RCTs section in Parent Dashboard
    expect(CLINICAL_STUDIES_AND_TRIALS.length).toBeGreaterThanOrEqual(6);
    renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('clinical-studies-rct-section')).toBeInTheDocument();
    });
    expect(screen.getByTestId('clinical-study-card-barkley-ef-1997')).toBeInTheDocument();
    expect(screen.getByTestId('clinical-study-card-kollins-stars-adhd-2020')).toBeInTheDocument();
  });

  it('Per-Device Child Micro-Profiles & Continual Learning: creates independent profiles per child and trains the adaptation model from progress', async () => {
    // 1. Unit-test the Continual Learning EMA update on a child profile
    const initialProfile = createDefaultChildProfile('6-8');
    expect(initialProfile.learnedModel.totalSessionsCompleted).toBe(0);
    expect(initialProfile.learnedModel.domainMastery.visualAttention).toBe(0.5);

    // Child completes 01-visual-search with 0 hints and 0 impulsive taps -> visualAttention mastery increases!
    const trained1 = trainChildProfileOnActivityCompletion(initialProfile, {
      activityId: '01-visual-search',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 35,
    });
    expect(trained1.learnedModel.totalSessionsCompleted).toBe(1);
    expect(trained1.learnedModel.domainMastery.visualAttention).toBeGreaterThan(0.5);
    expect(trained1.learnedModel.activityPlayCounts['01-visual-search']).toBe(1);

    // After 2 smooth completions, evaluateInvisibleScenario adopts SCENARIO_MASTERY_CHALLENGE from Round 1!
    const trained2 = trainChildProfileOnActivityCompletion(trained1, {
      activityId: '02-spot-difference',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 30,
    });
    const adoptedScenario = evaluateInvisibleScenario({
      ageBand: trained2.ageBand,
      completedRoundsCount: 0,
      gentleNudgesInCurrentActivity: 0,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 0,
      seatedModeActive: false,
      learnedModel: trained2.learnedModel,
    });
    expect(adoptedScenario.scenarioId).toBe('SCENARIO_MASTERY_CHALLENGE');
    expect(adoptedScenario.enrichChallenge).toBe(true);

    // 2. Integration test: Create a second Child Micro-Profile on the Child Hub and verify isolation
    renderRoute('/');
    expect(screen.getByTestId('child-profile-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('personalized-recommendation-card')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-create-profile-btn'));
    fireEvent.change(screen.getByTestId('new-profile-name-input'), {
      target: { value: 'Αριάδνη' },
    });
    fireEvent.click(screen.getByTestId('new-profile-age-8-10'));
    fireEvent.click(screen.getByTestId('submit-create-profile-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Γεια σου, Αριάδνη!/i)).toBeInTheDocument();
    });
  });

  it('Autonomous Game Mechanics: Activity 09 (Wait Signal), Activity 03 (Visual Memory), and Activity 07 (Move & Freeze) advance automatically on screen without requiring manual Next/Hide clicks', () => {
    vi.useFakeTimers();

    // 1. Activity 09 (Wait Signal): Objects appear automatically on screen every cptIntervalMs (2100ms for 6-8)
    const { unmount: u09 } = renderRoute('/activity/09-wait-signal');
    expect(screen.getByTestId('signal-stage-waiting')).toBeInTheDocument();

    // Advance timer twice (2 x 2200ms) WITHOUT pressing any manual Next button -> Golden Star appears automatically!
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByTestId('signal-stage-ready')).toBeInTheDocument();

    // Tapping directly on the central stage card completes Round 1 -> Round 2!
    fireEvent.click(screen.getByTestId('signal-stage-ready'));
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');
    u09();

    // 2. Activity 03 (Visual Memory): Cards automatically flip face-down after the observation countdown (3400ms)
    const { unmount: u03 } = renderRoute('/activity/03-visual-memory');
    expect(screen.getByTestId('memory-card-target')).toHaveTextContent('Κόκκινο Μήλο');

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    // Now cards are automatically hidden ('Πού ήταν;') without pressing any button!
    expect(screen.getByTestId('memory-card-target')).toHaveTextContent('Πού ήταν;');
    fireEvent.click(screen.getByTestId('memory-card-target'));
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');
    u03();

    // 3. Activity 07 (Move & Freeze): Staying still during FREEZE phase automatically completes the statue hold!
    const { unmount: u07 } = renderRoute('/activity/07-move-freeze');
    // Complete Round 1 (GO)
    fireEvent.click(screen.getByTestId('signal-card-go'));
    act(() => {
      vi.advanceTimersByTime(450);
    });
    fireEvent.click(screen.getByTestId('signal-card-go'));
    expect(screen.getByTestId('signal-card-freeze')).toBeInTheDocument();

    // Stay still for 3100ms during FREEZE -> automatically advances to Round 3!
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.getByTestId('round-pebble-3')).toHaveTextContent('3');
    u07();

    vi.useRealTimers();
  });

  it('Age-Graded & Performance Difficulty Calibration: scales complexity across all 5 age bands (4-5 to 10-12) and live performance', async () => {
    const balanced68 = evaluateInvisibleScenario({
      ageBand: '6-8',
      completedRoundsCount: 0,
      gentleNudgesInCurrentActivity: 0,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 0,
      seatedModeActive: false,
    });
    const diff45 = getAgeAndPerformanceDifficulty('4-5', balanced68, 0);
    const diff68 = getAgeAndPerformanceDifficulty('6-8', balanced68, 0);
    const diff1012 = getAgeAndPerformanceDifficulty('10-12', balanced68, 0);

    expect(diff45.tierLevel).toBe(1);
    expect(diff45.isSimplified).toBe(true);
    expect(diff68.tierLevel).toBe(3);
    expect(diff1012.tierLevel).toBe(5);
    expect(diff1012.isAdvancedMastery).toBe(true);
    expect(diff45.cptIntervalMs).toBeGreaterThan(diff1012.cptIntervalMs);

    // Verify Activity 12 (Build Pattern) scales from 2 blocks (Age 4-5) to 4 blocks (Age 10-12)
    await saveSettings({ ageBand: '4-5' });
    const { unmount: u45 } = renderRoute('/activity/12-build-pattern');
    await waitFor(() => {
      expect(screen.getByTestId('live-difficulty-calibration-bar')).toHaveAttribute(
        'data-difficulty-tier',
        '1'
      );
    });
    expect(screen.getByTestId('pattern-slot-1')).toBeInTheDocument();
    expect(screen.queryByTestId('pattern-slot-2')).not.toBeInTheDocument();
    u45();

    await saveSettings({ ageBand: '10-12' });
    const { unmount: u1012 } = renderRoute('/activity/12-build-pattern');
    await waitFor(() => {
      expect(screen.getByTestId('live-difficulty-calibration-bar')).toHaveAttribute(
        'data-difficulty-tier',
        '5'
      );
    });
    expect(screen.getByTestId('pattern-slot-3')).toBeInTheDocument();
    u1012();
  });

  it('Clinical & Parent Feedback Hub: allows therapists and parents to submit, persist, and export observations in Parent Dashboard', async () => {
    renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('parent-feedback-evaluation-section')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('feedback-role-select'), {
      target: { value: 'occupational-therapist' },
    });
    fireEvent.change(screen.getByTestId('feedback-center-input'), {
      target: { value: 'Πρότυπο Κέντρο ΔΕΠΥ Αθήνας' },
    });
    fireEvent.change(screen.getByTestId('feedback-scope-select'), {
      target: { value: '09-wait-signal' },
    });
    fireEvent.click(screen.getByTestId('feedback-age-6-8'));
    fireEvent.click(screen.getByTestId('feedback-star-5'));
    fireEvent.change(screen.getByTestId('feedback-comment-textarea'), {
      target: {
        value:
          'Εξαιρετική η αυτόματη εναλλαγή αντικειμένων στο 09. Προτείνουμε και επιλογή ήχου μετρονόμου.',
      },
    });

    fireEvent.click(screen.getByTestId('submit-feedback-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('feedback-entries-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feedback-entry-card-0')).toHaveTextContent(
      'Πρότυπο Κέντρο ΔΕΠΥ Αθήνας'
    );
    expect(screen.getByTestId('feedback-entry-card-0')).toHaveTextContent(
      'Εξαιρετική η αυτόματη εναλλαγή αντικειμένων'
    );
    expect(screen.getByTestId('send-batch-feedback-btn')).toBeInTheDocument();
    expect(screen.getByTestId('copy-feedback-report-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-feedback-report-btn')).toBeInTheDocument();
    // Ensure owner recipient email is never visible anywhere in the DOM
    expect(document.body.innerHTML).not.toContain('digiadsgr@gmail.com');

    const reportText = formatFeedbackReportText([
      {
        id: 1,
        timestamp: new Date().toISOString(),
        dateKey: '2026-10-24',
        reviewerRole: 'occupational-therapist',
        reviewerRoleLabelEl: '👐 Εργοθεραπευτής (OT)',
        reviewerNameOrCenter: 'Πρότυπο Κέντρο ΔΕΠΥ Αθήνας',
        targetScope: '09-wait-signal',
        targetScopeLabelEl: '09. Περίμενε το Σήμα',
        ageBandTested: '6-8',
        ratingStars: 5,
        usabilityScore: 5,
        clinicalAppropriatenessScore: 5,
        observationCategory: 'clinical-suggestion',
        commentEl: 'Δοκιμή αναφοράς Κέντρου ΔΕΠΥ.',
      },
    ]);
    expect(reportText).toContain('Πρότυπο Κέντρο ΔΕΠΥ Αθήνας');
    expect(reportText).toContain('Δοκιμή αναφοράς Κέντρου ΔΕΠΥ.');
  });

  it('License & Profiles Architecture: 100% Free & Unlocked in Dev Mode, 2-Profile Limit in Family Mode, and Unlimited Profiles + Quick Switcher in B2B Mode', async () => {
    // 1. Default Development Mode: ENABLE_PAYWALL is false, unlimited profiles, zero paywall prompts
    expect(ENABLE_PAYWALL).toBe(false);
    const defaultLicense = resolveEffectiveLicenseState({ licenseTier: 'dev-unlocked' });
    expect(defaultLicense.isDevUnlocked).toBe(true);
    expect(defaultLicense.statusLabelEl).toBe('Δοκιμαστική Έκδοση - Όλα Ξεκλείδωτα');
    expect(checkProfileCreationPermission(5, { licenseTier: 'dev-unlocked' }).allowed).toBe(true);

    // 2. Unit-test Family Plan (when ENABLE_PAYWALL = true or Family License Key active)
    const familyPermAt1 = checkProfileCreationPermission(1, { licenseTier: 'family' });
    expect(familyPermAt1.allowed).toBe(true);
    const familyPermAt2 = checkProfileCreationPermission(2, { licenseTier: 'family' });
    expect(familyPermAt2.allowed).toBe(false);
    expect(familyPermAt2.noticeEl).toBe(FAMILY_PLAN_LIMIT_NOTICE_EL);

    // 3. Unit-test B2B / Therapist License
    const b2bKeyRes = validateAndParseLicenseKey('B2B-CLINIC-2026');
    expect(b2bKeyRes.valid).toBe(true);
    expect(b2bKeyRes.tier).toBe('b2b');
    expect(checkProfileCreationPermission(10, { licenseTier: 'b2b' }).allowed).toBe(true);

    // 4. Integration test in Parent Area ("Διαχείριση Συνδρομής") and Child Hub
    const { unmount: unmountParent } = renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('subscription-management-section')).toBeInTheDocument();
    });

    // Verify default status is "Δοκιμαστική Έκδοση - Όλα Ξεκλείδωτα"
    expect(screen.getByTestId('subscription-current-status')).toHaveTextContent(
      'Δοκιμαστική Έκδοση - Όλα Ξεκλείδωτα'
    );
    expect(screen.getByTestId('stripe-family-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining('https://buy.stripe.com/')
    );
    expect(screen.getByTestId('stripe-b2b-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining('https://buy.stripe.com/')
    );

    // Activate Family mode via "Κωδικός Ενεργοποίησης" input
    fireEvent.change(screen.getByTestId('license-key-input'), {
      target: { value: 'FAMILY-2026' },
    });
    fireEvent.click(screen.getByTestId('activate-license-key-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('subscription-current-status')).toHaveTextContent(
        'Οικογενειακό Πλάνο'
      );
    });

    // Create 2nd profile in Parent Area (allowed, total = 2)
    fireEvent.change(screen.getByTestId('parent-new-profile-name-input'), {
      target: { value: 'Δεύτερο Παιδί' },
    });
    fireEvent.click(screen.getByTestId('parent-create-profile-btn'));

    // Now at 2 profiles under Family Plan -> friendly notice is displayed for 3rd profile!
    await waitFor(() => {
      expect(screen.getByTestId('parent-family-plan-limit-notice')).toHaveTextContent(
        'Το οικογενειακό πλάνο περιλαμβάνει έως 2 προφίλ παιδιών. Για επιπλέον προφίλ απαιτείται αναβάθμιση.'
      );
    });
    expect(screen.getByTestId('parent-family-limit-stripe-upgrade-link')).toBeInTheDocument();

    // Activate B2B / Therapist License via "Κωδικός Ενεργοποίησης" -> unlocks 3+ profiles & Quick Switcher
    fireEvent.change(screen.getByTestId('license-key-input'), {
      target: { value: 'B2B-CLINIC-2026' },
    });
    fireEvent.click(screen.getByTestId('activate-license-key-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('therapist-quick-profile-switcher')).toBeInTheDocument();
    });

    // Create 3rd profile under B2B mode -> succeeds without any limitation!
    fireEvent.change(screen.getByTestId('parent-new-profile-name-input'), {
      target: { value: 'Τρίτο Παιδί Κλινικής' },
    });
    fireEvent.click(screen.getByTestId('parent-create-profile-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('therapist-quick-switcher-select').children.length).toBe(3);
    });

    unmountParent();
  });
});
