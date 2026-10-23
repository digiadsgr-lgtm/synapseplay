import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { INTERDISCIPLINARY_PROTOCOLS } from '../data/interdisciplinaryProtocols';
import { evaluateInvisibleScenario } from '../utils/adaptiveScenarioEngine';
import { normalizeGreekForSpeech } from '../utils/soundAndSpeech';
import { CLINICAL_STUDIES_AND_TRIALS } from '../utils/clinicalAdhdEngine';
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
});
