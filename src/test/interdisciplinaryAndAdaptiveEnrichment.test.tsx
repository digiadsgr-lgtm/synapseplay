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
  rotateOptionsForSession,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import {
  AVATAR_PRESETS,
  createDefaultChildProfile,
  evaluateChildAvatarProgress,
  toGreekVocative,
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
import { getAllPrerenderRoutes, injectSeoIntoHtmlTemplate } from '../utils/seoEngine';
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

    // 2. Age 10-12: Speech Articulation serves 4-syllable compound words (╬á╬┐-╬┤╬«-╬╗╬▒-╧ä╬┐)
    await saveSettings({ ageBand: '10-12' });
    renderRoute('/activity/13-speech-articulation');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
        'data-age-band',
        '10-12'
      );
    });
    expect(screen.getByTestId('activity-13-speech-articulation')).toHaveTextContent('╬á╬┐-╬┤╬«-╬╗╬▒-╧ä╬┐');
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

  it('Greek Speech & Prosody Engine: normalizes ╬Ü╬ƒ╬ñ╬æ, ┬½╬Ü╬ƒ - ╬ñ╬æ┬╗, ╬Ü╬┐╧ä╬▒, syllables and phonemes into natural accented Greek (zero letter-by-letter spelling)', () => {
    const rawSentence =
      '╬å╬║╬┐╧à ╧Ç╧ü╬┐╧â╬╡╬║╧ä╬╣╬║╬¼ ╧ä╬╖ ╬╗╬¡╬╛╬╖: ┬½╬Ü╬ƒ - ╬ñ╬æ┬╗. ╬á╬┐╬╣╬▒ ╬╡╬╣╬║╧î╬╜╬▒ ╬┤╬╡╬»╧ç╬╜╬╡╬╣ ╧ä╬╖╬╜ ╬Ü╬ƒ╬ñ╬æ (╧î╧ç╬╣ ╧ä╬╖╬╜ ╬á╬ƒ╬í╬ñ╬æ); ≡ƒÉö';
    const normalized = normalizeGreekForSpeech(rawSentence);

    expect(normalized).toContain('╬║╧î╧ä╬▒');
    expect(normalized).toContain('╧Ç╧î╧ü╧ä╬▒');
    expect(normalized).not.toContain('╬Ü╬ƒ╬ñ╬æ');
    expect(normalized).not.toContain('╬Ü╬ƒ - ╬ñ╬æ');
    expect(normalized).not.toContain('≡ƒÉö');

    // Title-case unaccented "╬Ü╬┐╧ä╬▒" also normalizes to accented "╬║╧î╧ä╬▒"
    expect(normalizeGreekForSpeech('╬ù ╬╗╬¡╬╛╬╖ ╬Ü╬┐╧ä╬▒')).toContain('╬║╧î╧ä╬▒');

    // Hyphenated syllables normalize to fluent words
    expect(normalizeGreekForSpeech('╬º╧ä╧ì╧Ç╬▒ ┬½╬£╬á╬æ - ╬¢╬æ┬╗ ╬║╬▒╬╣ ┬½╬º╬ò-╬¢╬⌐-╬¥╬æ┬╗')).toContain('╬╝╧Ç╬¼╬╗╬▒');
    expect(normalizeGreekForSpeech('╬º╧ä╧ì╧Ç╬▒ ┬½╬£╬á╬æ - ╬¢╬æ┬╗ ╬║╬▒╬╣ ┬½╬º╬ò-╬¢╬⌐-╬¥╬æ┬╗')).toContain('╧ç╬╡╬╗╧Ä╬╜╬▒');
  });

  it('Dynamic Variety & Clinical RCT Engine: rotates game scenarios on shuffle/replay and renders clinical trials in Parent Dashboard', async () => {
    const { unmount } = renderRoute('/activity/01-visual-search');

    // Inner-speech coaching cue (Meichenbaum CBT / Barkley) is active
    expect(screen.getByTestId('inner-speech-cue-pill')).toBeInTheDocument();

    const firstTarget = screen.getByTestId('visual-search-target-badge').textContent;
    expect(firstTarget).toContain('╬á╧ü╬¼╧â╬╣╬╜╬╖ ╬º╬╡╬╗╧Ä╬╜╬▒');

    // Clicking "╬¥╬¡╬▒ ╬á╬▒╧ü╬▒╬╗╬╗╬▒╬│╬«" rotates to a brand-new set of items from the expanded pool
    fireEvent.click(screen.getByTestId('shuffle-variation-btn'));
    const nextTarget = screen.getByTestId('visual-search-target-badge').textContent;
    expect(nextTarget).not.toBe(firstTarget);
    expect(nextTarget).toContain('╬ú╬┐╧å╬« ╬Ü╬┐╧à╬║╬┐╧à╬▓╬¼╬│╬╣╬▒');
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
    renderRoute('/app');
    expect(screen.getByTestId('child-profile-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('personalized-recommendation-card')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-create-profile-btn'));
    fireEvent.change(screen.getByTestId('new-profile-name-input'), {
      target: { value: '╬æ╧ü╬╣╬¼╬┤╬╜╬╖' },
    });
    fireEvent.click(screen.getByTestId('new-profile-age-8-10'));
    fireEvent.click(screen.getByTestId('submit-create-profile-btn'));

    await waitFor(() => {
      expect(screen.getByText(/╬ô╬╡╬╣╬▒ ╧â╬┐╧à, ╬æ╧ü╬╣╬¼╬┤╬╜╬╖!/i)).toBeInTheDocument();
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
    expect(screen.getByTestId('memory-card-target')).toHaveTextContent('╬Ü╧î╬║╬║╬╣╬╜╬┐ ╬£╬«╬╗╬┐');

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    // Now cards are automatically hidden ('╬á╬┐╧ì ╬«╧ä╬▒╬╜;') without pressing any button!
    expect(screen.getByTestId('memory-card-target')).toHaveTextContent('╬á╬┐╧ì ╬«╧ä╬▒╬╜;');
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
      target: { value: '╬á╧ü╧î╧ä╧à╧Ç╬┐ ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ö╬ò╬á╬Ñ ╬æ╬╕╬«╬╜╬▒╧é' },
    });
    fireEvent.change(screen.getByTestId('feedback-scope-select'), {
      target: { value: '09-wait-signal' },
    });
    fireEvent.click(screen.getByTestId('feedback-age-6-8'));
    fireEvent.click(screen.getByTestId('feedback-star-5'));
    fireEvent.change(screen.getByTestId('feedback-comment-textarea'), {
      target: {
        value:
          '╬ò╬╛╬▒╬╣╧ü╬╡╧ä╬╣╬║╬« ╬╖ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬╖ ╬╡╬╜╬▒╬╗╬╗╬▒╬│╬« ╬▒╬╜╧ä╬╣╬║╬╡╬╣╬╝╬¡╬╜╧ë╬╜ ╧â╧ä╬┐ 09. ╬á╧ü╬┐╧ä╬╡╬»╬╜╬┐╧à╬╝╬╡ ╬║╬▒╬╣ ╬╡╧Ç╬╣╬╗╬┐╬│╬« ╬«╧ç╬┐╧à ╬╝╬╡╧ä╧ü╬┐╬╜╧î╬╝╬┐╧à.',
      },
    });

    fireEvent.click(screen.getByTestId('submit-feedback-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('feedback-entries-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feedback-entry-card-0')).toHaveTextContent(
      '╬á╧ü╧î╧ä╧à╧Ç╬┐ ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ö╬ò╬á╬Ñ ╬æ╬╕╬«╬╜╬▒╧é'
    );
    expect(screen.getByTestId('feedback-entry-card-0')).toHaveTextContent(
      '╬ò╬╛╬▒╬╣╧ü╬╡╧ä╬╣╬║╬« ╬╖ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬╖ ╬╡╬╜╬▒╬╗╬╗╬▒╬│╬« ╬▒╬╜╧ä╬╣╬║╬╡╬╣╬╝╬¡╬╜╧ë╬╜'
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
        reviewerRoleLabelEl: '≡ƒæÉ ╬ò╧ü╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬«╧é (OT)',
        reviewerNameOrCenter: '╬á╧ü╧î╧ä╧à╧Ç╬┐ ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ö╬ò╬á╬Ñ ╬æ╬╕╬«╬╜╬▒╧é',
        targetScope: '09-wait-signal',
        targetScopeLabelEl: '09. ╬á╬╡╧ü╬»╬╝╬╡╬╜╬╡ ╧ä╬┐ ╬ú╬«╬╝╬▒',
        ageBandTested: '6-8',
        ratingStars: 5,
        usabilityScore: 5,
        clinicalAppropriatenessScore: 5,
        observationCategory: 'clinical-suggestion',
        commentEl: '╬ö╬┐╬║╬╣╬╝╬« ╬▒╬╜╬▒╧å╬┐╧ü╬¼╧é ╬Ü╬¡╬╜╧ä╧ü╬┐╧à ╬ö╬ò╬á╬Ñ.',
      },
    ]);
    expect(reportText).toContain('╬á╧ü╧î╧ä╧à╧Ç╬┐ ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ö╬ò╬á╬Ñ ╬æ╬╕╬«╬╜╬▒╧é');
    expect(reportText).toContain('╬ö╬┐╬║╬╣╬╝╬« ╬▒╬╜╬▒╧å╬┐╧ü╬¼╧é ╬Ü╬¡╬╜╧ä╧ü╬┐╧à ╬ö╬ò╬á╬Ñ.');
  });

  it('License & Profiles Architecture: 100% Free & Unlocked in Dev Mode, 2-Profile Limit in Family Mode, and Unlimited Profiles + Quick Switcher in B2B Mode', async () => {
    // 1. Default Development Mode: ENABLE_PAYWALL is false, unlimited profiles, zero paywall prompts
    expect(ENABLE_PAYWALL).toBe(false);
    const defaultLicense = resolveEffectiveLicenseState({ licenseTier: 'dev-unlocked' });
    expect(defaultLicense.isDevUnlocked).toBe(true);
    expect(defaultLicense.statusLabelEl).toBe('╬ö╬┐╬║╬╣╬╝╬▒╧â╧ä╬╣╬║╬« ╬ê╬║╬┤╬┐╧â╬╖ - ╬î╬╗╬▒ ╬₧╬╡╬║╬╗╬╡╬»╬┤╧ë╧ä╬▒');
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

    // 4. Integration test in Parent Area ("╬ö╬╣╬▒╧ç╬╡╬»╧ü╬╣╧â╬╖ ╬ú╧à╬╜╬┤╧ü╬┐╬╝╬«╧é") and Child Hub
    const { unmount: unmountParent } = renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('subscription-management-section')).toBeInTheDocument();
    });

    // Verify default status is "╬ö╬┐╬║╬╣╬╝╬▒╧â╧ä╬╣╬║╬« ╬ê╬║╬┤╬┐╧â╬╖ - ╬î╬╗╬▒ ╬₧╬╡╬║╬╗╬╡╬»╬┤╧ë╧ä╬▒"
    expect(screen.getByTestId('subscription-current-status')).toHaveTextContent(
      '╬ö╬┐╬║╬╣╬╝╬▒╧â╧ä╬╣╬║╬« ╬ê╬║╬┤╬┐╧â╬╖ - ╬î╬╗╬▒ ╬₧╬╡╬║╬╗╬╡╬»╬┤╧ë╧ä╬▒'
    );
    expect(screen.getByTestId('stripe-family-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining('https://buy.stripe.com/')
    );
    expect(screen.getByTestId('stripe-b2b-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining('https://buy.stripe.com/')
    );

    // Activate Family mode via "╬Ü╧ë╬┤╬╣╬║╧î╧é ╬ò╬╜╬╡╧ü╬│╬┐╧Ç╬┐╬»╬╖╧â╬╖╧é" input
    fireEvent.change(screen.getByTestId('license-key-input'), {
      target: { value: 'FAMILY-2026' },
    });
    fireEvent.click(screen.getByTestId('activate-license-key-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('subscription-current-status')).toHaveTextContent(
        '╬ƒ╬╣╬║╬┐╬│╬╡╬╜╬╡╬╣╬▒╬║╧î ╬á╬╗╬¼╬╜╬┐'
      );
    });

    // Create 2nd profile in Parent Area (allowed, total = 2)
    fireEvent.change(screen.getByTestId('parent-new-profile-name-input'), {
      target: { value: '╬ö╬╡╧ì╧ä╬╡╧ü╬┐ ╬á╬▒╬╣╬┤╬»' },
    });
    fireEvent.click(screen.getByTestId('parent-create-profile-btn'));

    // Now at 2 profiles under Family Plan -> friendly notice is displayed for 3rd profile!
    await waitFor(() => {
      expect(screen.getByTestId('parent-family-plan-limit-notice')).toHaveTextContent(
        '╬ñ╬┐ ╬┐╬╣╬║╬┐╬│╬╡╬╜╬╡╬╣╬▒╬║╧î ╧Ç╬╗╬¼╬╜╬┐ ╧Ç╬╡╧ü╬╣╬╗╬▒╬╝╬▓╬¼╬╜╬╡╬╣ ╬¡╧ë╧é 2 ╧Ç╧ü╬┐╧å╬»╬╗ ╧Ç╬▒╬╣╬┤╬╣╧Ä╬╜. ╬ô╬╣╬▒ ╬╡╧Ç╬╣╧Ç╬╗╬¡╬┐╬╜ ╧Ç╧ü╬┐╧å╬»╬╗ ╬▒╧Ç╬▒╬╣╧ä╬╡╬»╧ä╬▒╬╣ ╬▒╬╜╬▒╬▓╬¼╬╕╬╝╬╣╧â╬╖.'
      );
    });
    expect(screen.getByTestId('parent-family-limit-stripe-upgrade-link')).toBeInTheDocument();

    // Activate B2B / Therapist License via "╬Ü╧ë╬┤╬╣╬║╧î╧é ╬ò╬╜╬╡╧ü╬│╬┐╧Ç╬┐╬»╬╖╧â╬╖╧é" -> unlocks 3+ profiles & Quick Switcher
    fireEvent.change(screen.getByTestId('license-key-input'), {
      target: { value: 'B2B-CLINIC-2026' },
    });
    fireEvent.click(screen.getByTestId('activate-license-key-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('therapist-quick-profile-switcher')).toBeInTheDocument();
    });

    // Create 3rd profile under B2B mode -> succeeds without any limitation!
    fireEvent.change(screen.getByTestId('parent-new-profile-name-input'), {
      target: { value: '╬ñ╧ü╬»╧ä╬┐ ╬á╬▒╬╣╬┤╬» ╬Ü╬╗╬╣╬╜╬╣╬║╬«╧é' },
    });
    fireEvent.click(screen.getByTestId('parent-create-profile-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('therapist-quick-switcher-select').children.length).toBe(3);
    });

    unmountParent();
  });

  it('Marketing & Presentation Landing Page (/): renders all 7 required sections, interactive Age Pathways (4-12), and navigates to /app', async () => {
    renderRoute('/');

    // 1. Hero section & Trust Badges (and verify App TopBar is NOT rendered on '/')
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-home-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('smooth-landing-ring')).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-hero-badge')).toHaveTextContent(
      '╬₧╬¡╧ü╬┐╧à╬╝╬╡ ╧ä╬╣ ╬▒╬╜╧ä╬╣╬╝╬╡╧ä╧ë╧Ç╬»╬╢╬╡╧ä╬╡ ΓÇö ╬ê╧ç╬┐╧à╬╝╬╡ ╧ä╬╖ ╬╗╧ì╧â╬╖'
    );
    expect(screen.getByTestId('landing-hero-headline')).toHaveTextContent(
      '┬½╬ñ╬┐ ╬╝╧à╬▒╬╗╧î ╬╝╬┐╧à ╧ä╧ü╬¡╧ç╬╡╬╣ ╬│╧ü╬«╬│╬┐╧ü╬▒!┬╗ ╬ê╬╗╬▒ ╬╜╬▒ ╧Ç╬▒╬»╬╛╬┐╧à╬╝╬╡ ╬╗╬»╬│╬┐ ╬╝╬▒╬╢╬», ╬╜╬▒ ╧Ç╬¼╧ü╬┐╧à╬╝╬╡ ╬╝╬╣╬▒ ╬▒╬╜╬¼╧â╬▒ ╬║╬▒╬╣ ╬╜╬▒ ╬▓╧ü╬┐╧ì╬╝╬╡ ╧ä╬┐╬╜ ╧ü╧à╬╕╬╝╧î ╬╝╬▒╧é.'
    );
    expect(screen.getByTestId('landing-trust-badges')).toHaveTextContent('100% Client-Side & Local');
    expect(screen.getByTestId('landing-trust-badges')).toHaveTextContent('╬º╧ë╧ü╬»╧é ╬ö╬╣╬▒╧å╬╖╬╝╬»╧â╬╡╬╣╧é');
    expect(screen.getByTestId('landing-trust-badges')).toHaveTextContent('╬ú╧ç╬╡╬┤╬╣╬▒╧â╬╝╬¡╬╜╬┐ ╬│╬╣╬▒ Tablet');

    // 2. The Problem We Solve (3 columns)
    expect(screen.getByTestId('landing-problem-section')).toHaveTextContent(
      '╬î╧ç╬╣ ╬¼╬╗╬╗╬┐ Zombie Scrolling'
    );
    expect(screen.getByTestId('landing-problem-section')).toHaveTextContent(
      '╬£╬╖╬┤╬╡╬╜╬╣╬║╬« ╬ñ╬╣╬╝╧ë╧ü╬»╬▒ (No Game Over)'
    );
    expect(screen.getByTestId('landing-problem-section')).toHaveTextContent(
      '╬ú╧ì╬╜╬┤╬╡╧â╬╖ ╬╝╬╡ ╧ä╬┐╬╜ ╬á╧ü╬▒╬│╬╝╬▒╧ä╬╣╬║╧î ╬º╧Ä╧ü╬┐'
    );

    // 3. The 4 Pillars & Module 13 Smooth Landing Callout
    expect(screen.getByTestId('landing-pillars-section')).toHaveTextContent(
      '╬ƒ╬╝╬¼╬┤╬▒ ╬æ: Detective Eyes'
    );
    expect(screen.getByTestId('landing-pillars-section')).toHaveTextContent(
      '╬ƒ╬╝╬¼╬┤╬▒ ╬Æ: Think & Plan'
    );
    expect(screen.getByTestId('landing-pillars-section')).toHaveTextContent(
      '╬ƒ╬╝╬¼╬┤╬▒ ╬ô: Pause & Choose'
    );
    expect(screen.getByTestId('landing-pillars-section')).toHaveTextContent(
      '╬ƒ╬╝╬¼╬┤╬▒ ╬ö: Move & Build'
    );
    expect(screen.getByTestId('landing-smooth-landing-callout')).toHaveTextContent(
      'Module 13: Smooth Landing Protocol'
    );

    // 4. Age-Appropriate Pathways (4-5 to 10-12 interactive tabs)
    fireEvent.click(screen.getByTestId('landing-age-tab-4-5'));
    expect(screen.getByTestId('landing-active-age-card')).toHaveTextContent(
      '╬£╬╖╬┤╬╡╬╜╬╣╬║╧î ╬║╬╡╬»╬╝╬╡╬╜╬┐, ╬╝╬╡╬│╬¼╬╗╬▒ ╬╡╬╣╬║╬┐╬╜╬┐╬│╧ü╬¼╬╝╬╝╬▒╧ä╬▒, ╬▒╬╣╧â╬╕╬╖╧ä╬╖╧ü╬╣╬▒╬║╬« ╬│╬╡╬»╧ë╧â╬╖.'
    );
    fireEvent.click(screen.getByTestId('landing-age-tab-10-12'));
    expect(screen.getByTestId('landing-active-age-card')).toHaveTextContent(
      '╬£╬╡╧ä╬▒╬│╬╜╧Ä╧â╬╖, ╧â╧ä╧ü╬▒╧ä╬╖╬│╬╣╬║╧î╧é ╧â╧ç╬╡╬┤╬╣╬▒╧â╬╝╧î╧é ╧Ç╬┐╬╗╬╗╬▒╧Ç╬╗╧Ä╬╜ ╬▓╬╖╬╝╬¼╧ä╧ë╬╜.'
    );

    // 5. Pricing & Licensing Plans + Beta Free Badge + All 4 Live Stripe Checkout URLs
    expect(screen.getByTestId('landing-beta-free-badge')).toHaveTextContent(
      '╬ñ╧ü╬¡╧ç╬┐╧à╧â╬▒ ╬ª╬¼╧â╬╖: ╬ö╧ë╧ü╬╡╬¼╬╜ ╬ö╬┐╬║╬╣╬╝╬▒╧â╧ä╬╣╬║╬« ╬á╧ü╧î╧â╬▓╬▒╧â╬╖ (Beta) ╬│╬╣╬▒ ╬î╬╗╬┐╧à╧é!'
    );
    expect(screen.getByTestId('landing-plan-family')).toHaveTextContent('╬ê╧ë╧é 2 ╬á╧ü╬┐╧å╬»╬╗ ╬á╬▒╬╣╬┤╬╣╧Ä╬╜');
    expect(screen.getByTestId('landing-plan-b2b')).toHaveTextContent(
      '╬æ╧Ç╬╡╧ü╬╣╧î╧ü╬╣╧â╧ä╬▒ ╬á╧ü╬┐╧å╬»╬╗ ╬á╬▒╬╣╬┤╬╣╧Ä╬╜ & ╬ô╧ü╬«╬│╬┐╧ü╬┐╧é Profile Switcher'
    );
    expect(screen.getByTestId('landing-stripe-family-monthly-link')).toHaveAttribute(
      'href',
      'https://buy.stripe.com/aFa00jbdT03t5bHgeg63K02'
    );
    expect(screen.getByTestId('landing-stripe-family-yearly-link')).toHaveAttribute(
      'href',
      'https://buy.stripe.com/dRm8wP6XD17xdId8LO63K03'
    );
    expect(screen.getByTestId('landing-stripe-extra-profile-link')).toHaveAttribute(
      'href',
      'https://buy.stripe.com/eVq28req5cQfgUp2nq63K01'
    );
    expect(screen.getByTestId('landing-stripe-b2b-yearly-link')).toHaveAttribute(
      'href',
      'https://buy.stripe.com/4gM00jgydcQf7jP7HK63K00'
    );

    // 6. Privacy & Safety Commitment + 7. Footer
    expect(screen.getByTestId('landing-privacy-section')).toHaveTextContent('Zero Cloud Tracking');
    expect(screen.getByTestId('landing-privacy-section')).toHaveTextContent(
      '╬á╬╗╬«╧ü╬╖╧é ╬ö╬╣╬▒╬│╧ü╬▒╧å╬« ╬╝╬╡ 1 ╬Ü╬╗╬╣╬║'
    );
    expect(screen.getByTestId('landing-privacy-section')).toHaveTextContent(
      '╬ò╧Ç╬╣╧â╧ä╬╖╬╝╬┐╬╜╬╣╬║╬« ╬ò╬╣╬╗╬╣╬║╧ü╬»╬╜╬╡╬╣╬▒'
    );
    expect(screen.getByTestId('landing-footer')).toHaveTextContent('┬⌐ SynapsePlay ΓÇö FocusEngine 5+');

    // Clicking Primary Hero CTA ("╬ö╬┐╬║╬╣╬╝╬¼╧â╧ä╬╡ ╧ä╬┐ ╬ö╧ë╧ü╬╡╬¼╬╜ (Beta)") navigates to /app (ChildHubPage)
    fireEvent.click(screen.getByTestId('hero-primary-cta-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('child-hub-page')).toBeInTheDocument();
    });
  });

  it('Therapeutic Companion Avatars (Unicorns, Dragons, Animals) & Clinical Progress Evaluation: empowers child and evaluates ADHD domain growth', async () => {
    expect(AVATAR_PRESETS.length).toBeGreaterThanOrEqual(16);
    expect(AVATAR_PRESETS.some((p) => p.emoji === '≡ƒªä' && p.category === 'fantasy')).toBe(true);
    expect(AVATAR_PRESETS.some((p) => p.emoji === '≡ƒÉë' && p.category === 'fantasy')).toBe(true);

    // Verify speech normalization for abbreviations, phoneme hints, and ratios
    expect(normalizeGreekForSpeech('╬º╧ä╬▒╧Ç╧î╬┤╬╣ (╬æ╧ü╧ç╬»╬╢╬╡╬╣ ╬╝╬╡ ╬º) ╧â╬╡ 3 ╬┤╬╡╧à╧ä. (1/2)')).toContain(
      '╬▒╧ü╧ç╬»╬╢╬╡╬╣ ╬╝╬╡ ╧ä╬╖ ╧å╧ë╬╜╬┐╧ì╬╗╬▒ ╧ç╬┐╧à'
    );
    expect(normalizeGreekForSpeech('╬º╧ä╬▒╧Ç╧î╬┤╬╣ (╬æ╧ü╧ç╬»╬╢╬╡╬╣ ╬╝╬╡ ╬º) ╧â╬╡ 3 ╬┤╬╡╧à╧ä. (1/2)')).toContain(
      '╬┤╬╡╧à╧ä╬╡╧ü╧î╬╗╬╡╧Ç╧ä╬▒'
    );
    expect(normalizeGreekForSpeech('╬º╧ä╬▒╧Ç╧î╬┤╬╣ (╬æ╧ü╧ç╬»╬╢╬╡╬╣ ╬╝╬╡ ╬º) ╧â╬╡ 3 ╬┤╬╡╧à╧ä. (1/2)')).toContain(
      '1 ╬▒╧Ç╧î 2'
    );

    // Evaluate avatar evolution across sessions
    let profile = createDefaultChildProfile('6-8');
    profile = { ...profile, avatarEmoji: '≡ƒªä', nickname: '╬£╬╣╬║╧ü╧î╧é ╬£╬┐╬╜╧î╬║╬╡╧ü╬┐╧é' };
    const initialEval = evaluateChildAvatarProgress(profile);
    expect(initialEval.evolutionLevel).toBe(1);
    expect(initialEval.avatar.defaultNameEl).toBe('╬ª╧ë╧ä╬╡╬╣╬╜╧î╧é ╬£╬┐╬╜╧î╬║╬╡╧ü╬┐╧é');

    for (let i = 0; i < 6; i++) {
      profile = trainChildProfileOnActivityCompletion(profile, {
        activityId: '01-visual-search',
        hintsUsed: 0,
        impulsiveTapsAbsorbed: 0,
        durationSeconds: 35,
      });
    }
    const advancedEval = evaluateChildAvatarProgress(profile);
    expect(advancedEval.evolutionLevel).toBeGreaterThanOrEqual(3);
    expect(advancedEval.clinicalAssessmentEl).toContain('╬ú╧à╬╜╬┐╬╗╬╣╬║╧î╧é ╬ö╬╡╬»╬║╧ä╬╖╧é ╬ò╬╛╬¡╬╗╬╣╬╛╬╖╧é ╬ö╬ò╬á╬Ñ');

    // Interactive Companion Avatar Picker on Child Hub
    renderRoute('/app');
    fireEvent.click(screen.getByTestId('toggle-avatar-companion-picker-btn'));
    expect(screen.getByTestId('companion-avatar-picker-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('switch-avatar-btn-≡ƒªä'));
    await waitFor(() => {
      expect(screen.getByTestId('companion-superpower-banner')).toHaveTextContent(
        '╬£╬▒╬│╬╣╬║╬« ╬æ╬║╧ä╬»╬╜╬▒ ╬ò╧â╧ä╬»╬▒╧â╬╖╧é'
      );
    });
  });

  it('GDPR Compliance & Legal Center (/legal): renders DIGIADS attribution, GDPR consent banner, and interactive Right to Erasure', async () => {
    const { clearGdprConsentAck } = await import('../components/GdprConsentBanner');
    clearGdprConsentAck();
    const { unmount } = renderRoute('/');

    expect(screen.getByTestId('footer-digiads-link')).toHaveAttribute('href', 'https://digiads.gr');
    expect(screen.getByTestId('gdpr-consent-banner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gdpr-banner-accept-btn'));
    expect(screen.queryByTestId('gdpr-consent-banner')).not.toBeInTheDocument();
    unmount();

    renderRoute('/legal');
    expect(screen.getByTestId('legal-compliance-page')).toBeInTheDocument();
    expect(screen.getByTestId('legal-digiads-header-link')).toHaveAttribute(
      'href',
      'https://digiads.gr'
    );
    expect(screen.getByTestId('gdpr-rights-action-center')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gdpr-erase-all-data-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('gdpr-erase-confirmation')).toBeInTheDocument();
    });
  });

  it('ADHD Parent & B2B SEO Blog (/articles): renders all 22 SEO articles, filters by topic category, and verifies philological adaptation (┬½╧ä╬¼╬╝╧Ç╬╗╬╡╧ä (Tablet)┬╗)', async () => {
    renderRoute('/articles');
    expect(screen.getByTestId('parent-articles-page')).toBeInTheDocument();
    expect(screen.getByTestId('blog-article-card-01')).toBeInTheDocument();
    expect(screen.getByTestId('blog-article-card-10')).toBeInTheDocument();
    expect(screen.getByTestId('blog-article-card-11')).toBeInTheDocument();
    expect(screen.getByTestId('blog-article-card-22')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/╧ä╬▒╬╝╧Ç╬╗╬¡╧ä╬▒/i);

    fireEvent.click(screen.getByTestId('filter-articles-home'));
    expect(screen.getByTestId('blog-article-card-01')).toBeInTheDocument();
    expect(screen.queryByTestId('blog-article-card-11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-articles-clinical'));
    expect(screen.getByTestId('blog-article-card-11')).toBeInTheDocument();
    expect(screen.queryByTestId('blog-article-card-01')).not.toBeInTheDocument();
  });

  it('Philological Audit & Multi-Specialty Variety Engine: rotates non-repeating rounds and shuffles option positions across sessions', () => {
    const pool = Array.from({ length: 12 }, (_, i) => `round-${i + 1}`);
    const s0 = selectSessionRounds(pool, 3, 0);
    const s1 = selectSessionRounds(pool, 3, 1);
    const s2 = selectSessionRounds(pool, 3, 2);
    const s3 = selectSessionRounds(pool, 3, 3);
    const s4 = selectSessionRounds(pool, 3, 4);

    // First 4 sessions (seeds 0, 1, 2, 3) cover all 12 items in the pool with zero overlap!
    const combinedFirstCycle = new Set([...s0, ...s1, ...s2, ...s3]);
    expect(combinedFirstCycle.size).toBe(12);

    // Cycle 2 (seed 4) uses coprime stride so it forms a brand-new combination rather than repeating s0
    expect(s4).not.toEqual(s0);

    // Option position rotation keeps seed=0 unchanged and shifts positions for seed > 0
    const opts = ['A', 'B', 'C'];
    expect(rotateOptionsForSession(opts, 0, 1)).toEqual(['A', 'B', 'C']);
    expect(rotateOptionsForSession(opts, 1, 1)).not.toEqual(['A', 'B', 'C']);
  });

  it('Developer QA Audit: seamlessly transitions to next game via next-activity-in-category-btn and advances timer rounds strictly by 1 under React.StrictMode', () => {
    vi.useFakeTimers();

    // 1. Game-to-Game Transition inside React.StrictMode: completing Activity 01 and clicking "╬ò╧Ç╧î╬╝╬╡╬╜╬┐: ╬Æ╧ü╬╡╧é ╧ä╬╖ ╬ö╬╣╬▒╧å╬┐╧ü╬¼"
    // must reset SharedActivityRunner to ACTIVE_ROUND (Round 1) for Activity 02 instead of remaining stuck on COMPLETED.
    const { unmount: uTransition } = render(
      <React.StrictMode>
        <MemoryRouter initialEntries={['/activity/01-visual-search']}>
          <App />
        </MemoryRouter>
      </React.StrictMode>
    );

    for (let r = 1; r <= 3; r++) {
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('search-item-target'));
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
      'data-runner-phase',
      'COMPLETED'
    );

    // Click "ΓÅ¡∩╕Å ╬ò╧Ç╧î╬╝╬╡╬╜╬┐: ╬Æ╧ü╬╡╧é ╧ä╬╖ ╬ö╬╣╬▒╧å╬┐╧ü╬¼"
    fireEvent.click(screen.getByTestId('next-activity-in-category-btn'));

    expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
      'data-activity-id',
      '02-spot-difference'
    );
    expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
      'data-runner-phase',
      'ACTIVE_ROUND'
    );
    expect(screen.getByTestId('activity-02-spot-difference')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-complete-screen')).not.toBeInTheDocument();
    uTransition();

    // 2. React.StrictMode Timer Purity: Activity 07 FREEZE hold advances strictly from Round 2 -> Round 3 (never double-firing)
    const { unmount: uStrictTimer } = render(
      <React.StrictMode>
        <MemoryRouter initialEntries={['/activity/07-move-freeze']}>
          <App />
        </MemoryRouter>
      </React.StrictMode>
    );

    fireEvent.click(screen.getByTestId('signal-card-go'));
    act(() => {
      vi.advanceTimersByTime(450);
    });
    fireEvent.click(screen.getByTestId('signal-card-go'));
    expect(screen.getByTestId('signal-card-freeze')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    // Must be on Round 3 (ACTIVE_ROUND), NOT prematurely completed by double-invocation
    expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute(
      'data-runner-phase',
      'ACTIVE_ROUND'
    );
    expect(screen.getByTestId('round-pebble-3')).toHaveTextContent('3');
    uStrictTimer();

    vi.useRealTimers();
  });

  it('Field Evaluation Report Fixes (#1 & #2): Automatic Karaoke Syllable Runner, Age 8-10 Challenge, Emoji-Label Parity, and Distinct Activity 08 Riddles', async () => {
    vi.useFakeTimers();

    // 1. Automatic Karaoke Syllable Runner in Activity 13: syllables run automatically across the screen in rhythm!
    const { unmount: u13 } = renderRoute('/activity/13-speech-articulation');
    expect(screen.getByTestId('speech-clap-syllable-btn')).toHaveTextContent('0/3');

    // Advance through the automatic syllable runner (750ms initial + 3 * 650ms)
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(screen.getByTestId('speech-clap-syllable-btn')).toHaveTextContent('╬£╧Ç╧ü╬¼╬▓╬┐! (3/3 ╬ú╧à╬╗╬╗╬▒╬▓╬¡╧é)');
    u13();

    // 2. Age 8-10 receives 4-syllable compound challenge words in Activity 13 right from Round 1 (no boredom!)
    vi.useRealTimers();
    await saveSettings({ ageBand: '8-10' });
    const { unmount: u810 } = renderRoute('/activity/13-speech-articulation');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute('data-age-band', '8-10');
    });
    expect(screen.getByTestId('activity-13-speech-articulation')).toHaveTextContent('╬á╬┐-╬┤╬«-╬╗╬▒-╧ä╬┐');
    expect(screen.getByTestId('speech-articulation-target')).toHaveTextContent('≡ƒÜ▓');
    expect(screen.getByTestId('speech-articulation-target')).toHaveTextContent('╬á╬┐╬┤╬«╬╗╬▒╧ä╬┐');
    u810();

    // 3. Activity 02 (Spot the Difference) shows exact single-object labels matching each emoji ('╬ë╬╗╬╣╬┐╧é' vs '╬ª╬╡╬│╬│╬¼╧ü╬╣')
    const { unmount: u02 } = renderRoute('/activity/02-spot-difference');
    expect(screen.getByTestId('difference-item-target')).toHaveTextContent('╬ª╬╡╬│╬│╬¼╧ü╬╣');
    expect(screen.getByTestId('difference-item-target')).not.toHaveTextContent('╬ë╬╗╬╣╬┐╧é / ╬ª╬╡╬│╬│╬¼╧ü╬╣');
    u02();

    // 4. Activity 08 (Listen & Do) uses distinct auditory riddles & mystery cards while listening
    const { unmount: u08 } = renderRoute('/activity/08-listen-do');
    expect(screen.getByTestId('listen-do-target')).toHaveTextContent('╬å╬║╬┐╧à ╧Ç╧ü╧Ä╧ä╬▒...');
    u08();
  });

  it('Age 8-10 (9-Year-Old) Senior Calibration & Continuous Looping Karaoke Runner: serves STEM/Executive challenges and loops syllable runner continuously', async () => {
    vi.useFakeTimers();

    // 1. Continuous Looping Karaoke Runner in Activity 13: keeps cycling active syllable even after 4+ seconds!
    const { unmount: uLoop } = renderRoute('/activity/13-speech-articulation');
    expect(screen.getByTestId('live-syllable-runner-banner')).toBeInTheDocument();
    expect(screen.getByTestId('syllable-box-0')).toHaveAttribute('data-karaoke-active', 'true');

    // Advance past the first sweep (3500ms) -> runner continues looping to syllable 0 or 1!
    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(screen.getByTestId('live-syllable-runner-banner')).toHaveTextContent(
      /╬ñ╧ü╬¡╧ç╬╡╬╣ ╧ä╧Ä╧ü╬▒ ╬╖ ╧â╧à╬╗╬╗╬▒╬▓╬«|╬ƒ ╧ü╧à╬╕╬╝╧î╧é ╧â╧à╬╗╬╗╬▒╬▓╧Ä╬╜ ╬╡╧Ç╬▒╬╜╬▒╬╗╬▒╬╝╬▓╬¼╬╜╬╡╧ä╬▒╬╣/
    );
    uLoop();
    vi.useRealTimers();

    // 2. Switch to Age 8-10 (9-year-old) and verify Senior Challenge Pools across Activities 01, 03, 04, 05, 06, 08, 14, 15, 18
    await saveSettings({ ageBand: '8-10' });

    // Activity 01: 12-item Senior Detective visual search matrix
    const { unmount: u01 } = renderRoute('/activity/01-visual-search');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toHaveAttribute('data-age-band', '8-10');
    });
    expect(screen.getByTestId('visual-search-grid').children).toHaveLength(12);
    u01();

    // Activity 05: Senior STEM Experiment Routine instead of preschool toothbrushing
    const { unmount: u05 } = renderRoute('/activity/05-order-steps');
    await waitFor(() => {
      expect(screen.getByTestId('activity-05-order-steps')).toHaveTextContent(
        '╬ƒ╧ü╬│╬¼╬╜╧ë╧â╬╖ ╬ò╧Ç╬╣╧â╧ä╬╖╬╝╬┐╬╜╬╣╬║╬┐╧ì ╬á╬╡╬╣╧ü╬¼╬╝╬▒╧ä╬┐╧é (STEM)'
      );
    });
    u05();

    // Activity 14: Senior Robotics Team Scenario
    const { unmount: u14 } = renderRoute('/activity/14-narrative-builder');
    await waitFor(() => {
      expect(screen.getByTestId('activity-14-narrative-builder')).toHaveTextContent(
        '╬ù ╬ƒ╬╝╬¼╬┤╬▒ ╬í╬┐╬╝╧Ç╬┐╧ä╬╣╬║╬«╧é'
      );
    });
    u14();

    // Activity 15: Senior Temporal Inversion ("╬á╬í╬Ö╬¥... ╬▒╬╗╬╗╬¼ ╬æ╬ª╬ƒ╬Ñ...")
    const { unmount: u15 } = renderRoute('/activity/15-auditory-discrimination');
    await waitFor(() => {
      expect(screen.getByTestId('activity-15-auditory-discrimination')).toHaveTextContent(
        '╬º╧ü╬┐╬╜╬╣╬║╬« ╬æ╬╜╬▒╧â╧ä╧ü╬┐╧å╬« (8-12 ╬╡╧ä╧Ä╬╜)'
      );
    });
    u15();

    // Activity 18: Senior Homework Prioritization & Executive Planning
    const { unmount: u18 } = renderRoute('/activity/18-adl-praxis');
    await waitFor(() => {
      expect(screen.getByTestId('activity-18-adl-praxis')).toHaveTextContent(
        '╬Ö╬╡╧ü╬¼╧ü╧ç╬╖╧â╬╖ ╬æ╧Ç╬┐╬│╬╡╧à╬╝╬▒╧ä╬╣╬╜╬«╧é ╬£╬╡╬╗╬¡╧ä╬╖╧é'
      );
    });
    u18();
  });

  it('Modern Greek Grammar & Vocative Case (╬Ü╬╗╬╖╧ä╬╣╬║╬« ╬á╧ä╧Ä╧â╬╖): inflects child names and companion titles accurately in Hub and Completion screens', async () => {
    // 1. Unit tests for Modern Greek Vocative morphology (╬ô╧ü╬▒╬╝╬╝╬▒╧ä╬╣╬║╬« ╬ñ╧ü╬╣╬▒╬╜╧ä╬▒╧å╧à╬╗╬╗╬»╬┤╬╖)
    expect(toGreekVocative('╬£╬╣╬║╧ü╧î╧é ╬ò╬╛╬╡╧ü╬╡╧à╬╜╬╖╧ä╬«╧é')).toBe('╬£╬╣╬║╧ü╬¡ ╬ò╬╛╬╡╧ü╬╡╧à╬╜╬╖╧ä╬«');
    expect(toGreekVocative('╬ª╧ë╧ä╬╡╬╣╬╜╧î╧é ╬£╬┐╬╜╧î╬║╬╡╧ü╬┐╧é')).toBe('╬ª╧ë╧ä╬╡╬╣╬╜╬¡ ╬£╬┐╬╜╧î╬║╬╡╧ü╬╡');
    expect(toGreekVocative('╬ë╧ü╬╡╬╝╬┐╧é ╬ö╧ü╬¼╬║╬┐╧é ╧ä╬╖╧é ╬æ╬╜╬¼╧â╬▒╧é')).toBe('╬ë╧ü╬╡╬╝╬╡ ╬ö╧ü╬¼╬║╬╡ ╧ä╬╖╧é ╬æ╬╜╬¼╧â╬▒╧é');
    expect(toGreekVocative('╬ú╬┐╧å╧î╧é ╬£╬¼╬│╬┐╧é ╧ä╬╖╧é ╬£╬╜╬«╬╝╬╖╧é')).toBe('╬ú╬┐╧å╬¡ ╬£╬¼╬│╬╡ ╧ä╬╖╧é ╬£╬╜╬«╬╝╬╖╧é');
    expect(toGreekVocative('╬£╬╣╬║╧ü╧î╧é ╬æ╧â╧ä╧ü╬┐╬╜╬▒╧ì╧ä╬╖╧é')).toBe('╬£╬╣╬║╧ü╬¡ ╬æ╧â╧ä╧ü╬┐╬╜╬▒╧ì╧ä╬╖');
    expect(toGreekVocative('╬ô╧ü╬«╬│╬┐╧ü╬┐ ╬Ü╬┐╧à╬╜╬╡╬╗╬¼╬║╬╣ ╬í╧à╬╕╬╝╬┐╧ì')).toBe('╬ô╧ü╬«╬│╬┐╧ü╬┐ ╬Ü╬┐╧à╬╜╬╡╬╗╬¼╬║╬╣ ╬í╧à╬╕╬╝╬┐╧ì');

    // Masculine proper names (-╬┐╧é -> -╬┐ for disyllabic paroxytones; -╬┐╧é -> -╬╡ for polysyllabic; -╬╖╧é/-╬▒╧é -> drop -╧é)
    expect(toGreekVocative('╬ô╬╣╧Ä╧ü╬│╬┐╧é')).toBe('╬ô╬╣╧Ä╧ü╬│╬┐');
    expect(toGreekVocative('╬¥╬»╬║╬┐╧é')).toBe('╬¥╬»╬║╬┐');
    expect(toGreekVocative('╬á╬¡╧ä╧ü╬┐╧é')).toBe('╬á╬¡╧ä╧ü╬┐');
    expect(toGreekVocative('╬º╧ü╬«╧â╧ä╬┐╧é')).toBe('╬º╧ü╬«╧â╧ä╬┐');
    expect(toGreekVocative('╬æ╬╗╬¡╬╛╬▒╬╜╬┤╧ü╬┐╧é')).toBe('╬æ╬╗╬¡╬╛╬▒╬╜╬┤╧ü╬╡');
    expect(toGreekVocative('╬Ü╧ë╬╜╧â╧ä╬▒╬╜╧ä╬»╬╜╬┐╧é')).toBe('╬Ü╧ë╬╜╧â╧ä╬▒╬╜╧ä╬»╬╜╬╡');
    expect(toGreekVocative('╬ú╧ä╬¡╧å╬▒╬╜╬┐╧é')).toBe('╬ú╧ä╬¡╧å╬▒╬╜╬╡');
    expect(toGreekVocative('╬ö╬╖╬╝╬«╧ä╧ü╬╖╧é')).toBe('╬ö╬╖╬╝╬«╧ä╧ü╬╖');
    expect(toGreekVocative('╬ô╬╣╬¼╬╜╬╜╬╖╧é')).toBe('╬ô╬╣╬¼╬╜╬╜╬╖');
    expect(toGreekVocative('╬ƒ╧ü╬¡╧â╧ä╬╖╧é')).toBe('╬ƒ╧ü╬¡╧â╧ä╬╖');
    expect(toGreekVocative('╬Ü╧Ä╧â╧ä╬▒╧é')).toBe('╬Ü╧Ä╧â╧ä╬▒');
    expect(toGreekVocative('╬æ╬╜╬┤╧ü╬¡╬▒╧é')).toBe('╬æ╬╜╬┤╧ü╬¡╬▒');
    expect(toGreekVocative('╬æ╧ü╬╣╬¼╬┤╬╜╬╖')).toBe('╬æ╧ü╬╣╬¼╬┤╬╜╬╖');
    expect(toGreekVocative('╬å╧ü╧ä╬╡╬╝╬╣╧é')).toBe('╬å╧ü╧ä╬╡╬╝╬╖');

    // 2. Verify Child Hub greets the default profile in Vocative ("╬ô╬╡╬╣╬▒ ╧â╬┐╧à, ╬£╬╣╬║╧ü╬¡ ╬ò╬╛╬╡╧ü╬╡╧à╬╜╬╖╧ä╬«!")
    const { unmount: uHub } = renderRoute('/app');
    expect(screen.getByText(/╬ô╬╡╬╣╬▒ ╧â╬┐╧à, ╬£╬╣╬║╧ü╬¡ ╬ò╬╛╬╡╧ü╬╡╧à╬╜╬╖╧ä╬«!/i)).toBeInTheDocument();

    // Create a profile with a masculine name in Nominative ("╬ô╬╣╧Ä╧ü╬│╬┐╧é") and verify Vocative greeting ("╬ô╬╡╬╣╬▒ ╧â╬┐╧à, ╬ô╬╣╧Ä╧ü╬│╬┐!")
    fireEvent.click(screen.getByTestId('open-create-profile-btn'));
    fireEvent.change(screen.getByTestId('new-profile-name-input'), {
      target: { value: '╬ô╬╣╧Ä╧ü╬│╬┐╧é' },
    });
    fireEvent.click(screen.getByTestId('submit-create-profile-btn'));

    await waitFor(() => {
      expect(screen.getByText(/╬ô╬╡╬╣╬▒ ╧â╬┐╧à, ╬ô╬╣╧Ä╧ü╬│╬┐!/i)).toBeInTheDocument();
    });
    uHub();
  });

  it('Google Search Console Indexing Fix: pre-renders all 51 sitemap routes with self-referencing canonical tags and full semantic HTML', () => {
    const routes = getAllPrerenderRoutes();
    expect(routes).toHaveLength(51);
    expect(routes).toContain('/articles/01-smooth-landing-screen-meltdowns');
    expect(routes).toContain('/articles/09-fine-motor-writing-readiness');

    const sampleTemplate = `<!doctype html><html><head><title>Default</title><meta name="description" content="" /><meta name="keywords" content="" /><link rel="canonical" href="https://www.synapseplay.gr/" /><link rel="alternate" hreflang="el-GR" href="https://www.synapseplay.gr/" /><link rel="alternate" hreflang="x-default" href="https://www.synapseplay.gr/" /><meta property="og:type" content="website" /><meta property="og:url" content="https://www.synapseplay.gr/" /><meta property="og:title" content="" /><meta property="og:description" content="" /><meta property="og:image" content="" /><meta name="twitter:title" content="" /><meta name="twitter:description" content="" /><meta name="twitter:image" content="" /></head><body><div id="root"></div></body></html>`;

    const html09 = injectSeoIntoHtmlTemplate(
      sampleTemplate,
      '/articles/09-fine-motor-writing-readiness'
    );
    expect(html09).toContain(
      '<link rel="canonical" href="https://www.synapseplay.gr/articles/09-fine-motor-writing-readiness" />'
    );
    expect(html09).toContain(
      '<link rel="alternate" hreflang="el-GR" href="https://www.synapseplay.gr/articles/09-fine-motor-writing-readiness" />'
    );
    expect(html09).not.toContain('<link rel="canonical" href="https://www.synapseplay.gr/" />');
    expect(html09).toContain('╬î╧ä╬▒╬╜ ╧ä╬┐ ╧Ç╬▒╬╣╬┤╬» ╬║╬┐╧à╧ü╬¼╬╢╬╡╧ä╬▒╬╣ ╬▒╬╝╬¡╧â╧ë╧é ╧â╧ä╬┐ ╬│╧ü╬¼╧ê╬╣╬╝╬┐');

    const html01 = injectSeoIntoHtmlTemplate(
      sampleTemplate,
      '/articles/01-smooth-landing-screen-meltdowns'
    );
    expect(html01).toContain(
      '<link rel="canonical" href="https://www.synapseplay.gr/articles/01-smooth-landing-screen-meltdowns" />'
    );
    expect(html01).not.toContain('<link rel="canonical" href="https://www.synapseplay.gr/" />');
    expect(html01).toContain('╬ô╬╣╬▒╧ä╬» ╧ä╬┐ ╧Ç╬▒╬╣╬┤╬» ╬╝╬╡ ╬ö╬ò╬á╬Ñ ╬╛╬╡╧â╧Ç╬¼╬╡╬╣ ╧î╧ä╬▒╬╜ ╧ä╬┐╧à ╧Ç╬▒╬»╧ü╬╜╬╡╬╣╧é ╧ä╬┐ ╧ä╬¼╬╝╧Ç╬╗╬╡╧ä');
  });
});

