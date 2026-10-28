import { describe, expect, it } from 'vitest';
import {
  centerCodeFromLicenseRef,
  childCodeErrorEl,
  generateChildCode,
  isValidChildCode,
  parseChildCode,
  withChildCode,
} from '../utils/childCode';
import {
  exportChildProgress,
  importChildProgress,
  parseChildProgress,
  recordSessionLog,
  saveChildProfile,
} from '../db/database';
import { createDefaultChildProfile } from '../utils/childProfileLearningEngine';
import { sessionLogsToCsv } from '../utils/reportExport';

describe('Κωδικός παιδιού', () => {
  it('παράγει έγκυρους κωδικούς με τον κωδικό κέντρου', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateChildCode('K7QM');
      expect(code).toMatch(/^K7QM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]$/);
      expect(isValidChildCode(code)).toBe(true);
      expect(parseChildCode(code)?.centerCode).toBe('K7QM');
    }
  });

  it('πιάνει αλλαγή ενός χαρακτήρα και αντιμετάθεση γειτονικών', () => {
    const code = generateChildCode('K7QM').replace(/-/g, '');
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < 9; i++) {
      const other = alphabet[(alphabet.indexOf(code[i]) + 5) % 32];
      const bad = code.slice(0, i) + other + code.slice(i + 1);
      expect(isValidChildCode(bad)).toBe(false);
    }
    for (let i = 0; i < 8; i++) {
      if (code[i] === code[i + 1]) continue;
      const swapped = code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2);
      expect(isValidChildCode(swapped)).toBe(false);
    }
  });

  it('δέχεται πεζά, κενά και ελληνικά γράμματα που μοιάζουν με λατινικά', () => {
    const code = generateChildCode('KMPX');
    const greekish = code.toLowerCase().replace(/k/g, 'κ').replace(/m/g, 'μ').replace(/-/g, ' ');
    expect(parseChildCode(greekish)?.code).toBe(code);
  });

  it('δίνει κατανοητά μηνύματα λάθους', () => {
    expect(childCodeErrorEl('')).toContain('Γράψτε');
    expect(childCodeErrorEl('ABC')).toContain('9 χαρακτήρες');
    expect(childCodeErrorEl('K7QM-4HXA-0')).toContain('0, 1, O ή I');
    expect(childCodeErrorEl(generateChildCode('K7QM'))).toBeNull();
  });

  it('ο κωδικός κέντρου από άδεια B2B είναι σταθερός', () => {
    expect(centerCodeFromLicenseRef('1AbCdEfGhI')).toBe(centerCodeFromLicenseRef('1AbCdEfGhI'));
    expect(centerCodeFromLicenseRef('1AbCdEfGhI')).toMatch(/^[2-9A-HJ-NP-Z]{4}$/);
    expect(centerCodeFromLicenseRef('1AbCdEfGhI')).not.toBe(centerCodeFromLicenseRef('1AbCdEfGhJ'));
  });

  it('περνά τον κωδικό στο Stripe ως client_reference_id χωρίς να αλλάζει το link', () => {
    const code = generateChildCode('K7QM');
    const url = withChildCode('https://buy.stripe.com/test_abc', code);
    expect(url).toBe(`https://buy.stripe.com/test_abc?client_reference_id=${code}`);
    expect(withChildCode('https://buy.stripe.com/test_abc', 'λάθος')).toBe('https://buy.stripe.com/test_abc');
  });
});

describe('Αρχείο προόδου γονιός → θεραπευτής', () => {
  it('εξαγωγή από τον γονιό και εισαγωγή στον θεραπευτή χωρίς διπλές καταγραφές', async () => {
    const code = generateChildCode('K7QM');
    const home = {
      ...createDefaultChildProfile('6-8'),
      id: 'child-home-test',
      nickname: 'Νίκος',
      childCode: code,
    };
    await saveChildProfile(home);
    await recordSessionLog({
      activityId: '08' as never,
      activityTitleEl: 'Δοκιμή',
      categoryId: 'focus' as never,
      durationSeconds: 60,
      completedRounds: 5,
      totalRounds: 6,
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      seatedModeUsed: false,
      childProfileId: home.id,
      childNickname: home.nickname,
    });

    const file = await exportChildProgress(home);
    expect(file).not.toBeNull();
    expect(file!.childCode).toBe(code);
    expect(file!.sessionLogs.length).toBeGreaterThanOrEqual(1);
    expect(file!.sessionLogs.every((l) => l.source === 'home' && !l.childProfileId)).toBe(true);

    const parsed = parseChildProgress(JSON.stringify(file));
    // «συσκευή θεραπευτή»: το προφίλ με τον ίδιο κωδικό υπάρχει ήδη (ίδια βάση στο test)
    const first = await importChildProgress(parsed);
    expect(first.profile.childCode).toBe(code);
    const second = await importChildProgress(parsed);
    expect(second.added).toBe(0);
  });

  it('απορρίπτει άσχετα ή αλλοιωμένα αρχεία', () => {
    expect(() => parseChildProgress('όχι json')).toThrow('μη έγκυρο JSON');
    expect(() => parseChildProgress('{"format":"synapseplay-backup","version":1}')).toThrow(
      'δεν είναι αρχείο προόδου'
    );
    expect(() =>
      parseChildProgress(
        JSON.stringify({
          format: 'synapseplay-progress',
          version: 1,
          childCode: 'XXXX',
          profile: { nickname: 'a' },
          sessionLogs: [],
        })
      )
    ).toThrow('κατεστραμμένο');
  });

  it('το CSV δείχνει αν η καταγραφή είναι από το σπίτι', () => {
    const csv = sessionLogsToCsv(
      [
        {
          timestamp: new Date().toISOString(),
          dateKey: '2026-10-28',
          activityId: '08' as never,
          activityTitleEl: 'Δοκιμή',
          categoryId: 'focus' as never,
          durationSeconds: 60,
          completedRounds: 5,
          totalRounds: 6,
          hintsUsed: 0,
          impulsiveTapsAbsorbed: 0,
          seatedModeUsed: false,
          source: 'home',
        },
      ],
      []
    );
    expect(csv).toContain('Πού');
    expect(csv).toContain('σπίτι');
  });
});
