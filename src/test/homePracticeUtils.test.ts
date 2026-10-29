import { describe, expect, it } from 'vitest';
import { generateChildCode } from '../utils/childCode';
import { createDefaultChildProfile } from '../utils/childProfileLearningEngine';
import type { ActivitySessionLog } from '../types/domain';
import {
  buildProgressPayload,
  decryptProgress,
  encryptProgress,
  generateTherapistInboxKey,
  progressLink,
  WrongInboxError,
} from '../utils/secureProgress';
import { parsePlanToken, planLink, planWeekProgress, weekStartKey } from '../utils/practicePlan';
import { computeGarden, gardenEncouragementEl } from '../utils/garden';
import { currentSeason, gameOfTheWeek, isoWeek, orthodoxEaster } from '../utils/seasons';
import { buildIcs, foldLine } from '../utils/reminders';
import { canOfferMissionToday, pickHomeMission, pendingMissions } from '../utils/homeMissions';
import { buildAfterSessionTalk } from '../utils/afterSessionTalk';
import { ACTIVITIES } from '../data/activitiesCatalog';
import { checkInChange, isCheckInDue } from '../utils/parentCheckIn';

const log = (over: Partial<ActivitySessionLog> = {}): ActivitySessionLog => ({
  timestamp: new Date().toISOString(),
  dateKey: '2026-10-28',
  activityId: '04-sequence-memory',
  activityTitleEl: 'Μνήμη Ακολουθίας',
  categoryId: 'think-plan',
  durationSeconds: 140,
  completedRounds: 5,
  totalRounds: 5,
  hintsUsed: 1,
  impulsiveTapsAbsorbed: 0,
  errorsCount: 2,
  medianRoundMs: 3200,
  measurement: 'measured',
  seatedModeUsed: false,
  ageBand: '6-8',
  childProfileId: 'kid-1',
  ...over,
});

describe('Κρυπτογραφημένη αποστολή προόδου (χωρίς cloud)', () => {
  it('ο θεραπευτής ανοίγει ό,τι κρυπτογράφησε ο γονιός με το δημόσιο κλειδί του', async () => {
    const inbox = await generateTherapistInboxKey();
    const profile = {
      ...createDefaultChildProfile('6-8'),
      id: 'kid-1',
      nickname: 'Μαρία',
      childCode: generateChildCode('K7QM'),
      homeMissions: [
        {
          id: 'm1',
          missionId: 'wm-1',
          emoji: '🎒',
          textEl: 'Φέρε 4 πράγματα',
          offeredAt: new Date().toISOString(),
          dateKey: '2026-10-28',
          status: 'done' as const,
        },
      ],
      parentCheckIns: [{ id: 'q1', dateKey: '2026-10-01', answers: [2, 3, 3, 2, 4] as [number, number, number, number, number] }],
    };
    const logs = Array.from({ length: 60 }, (_, i) =>
      log({ timestamp: new Date(Date.now() - i * 3600_000).toISOString() })
    );
    const payload = buildProgressPayload(profile, [...logs, log({ childProfileId: 'other' })]);
    expect(payload.l).toHaveLength(60);

    const token = await encryptProgress(payload, {
      x: inbox.publicJwk.x!,
      y: inbox.publicJwk.y!,
      kid: inbox.kid,
    });
    expect(token.startsWith(`p1.${inbox.kid}.`)).toBe(true);
    // Το όνομα του παιδιού δεν φαίνεται πουθενά στον σύνδεσμο
    expect(token).not.toContain('Μαρία');
    expect(token.length).toBeLessThan(30000);

    const link = progressLink(token, 'https://www.synapseplay.gr');
    expect(link).toMatch(/^https:\/\/www\.synapseplay\.gr\/receive#p1\./);

    const out = await decryptProgress(link, inbox);
    expect(out.childCode).toBe(profile.childCode);
    expect(out.nickname).toBe('Μαρία');
    expect(out.sessionLogs).toHaveLength(60);
    expect(out.sessionLogs[0].source).toBe('home');
    expect(out.sessionLogs[0].activityTitleEl).toBe('Μνήμη Ακολουθίας');
    expect(out.sessionLogs[0].errorsCount).toBe(2);
    expect(out.homeMissions[0].status).toBe('done');
    expect(out.parentCheckIns[0].answers).toEqual([2, 3, 3, 2, 4]);
  });

  it('άλλη συσκευή θεραπευτή ή αλλοιωμένος σύνδεσμος δεν ανοίγει', async () => {
    const inbox = await generateTherapistInboxKey();
    const other = await generateTherapistInboxKey();
    const profile = { ...createDefaultChildProfile('6-8'), id: 'kid-1', childCode: generateChildCode('K7QM') };
    const token = await encryptProgress(buildProgressPayload(profile, [log()]), {
      x: inbox.publicJwk.x!,
      y: inbox.publicJwk.y!,
      kid: inbox.kid,
    });
    await expect(decryptProgress(token, other)).rejects.toBeInstanceOf(WrongInboxError);
    // ίδιο kid, άλλο ιδιωτικό κλειδί → αποτυγχάνει η αυθεντικοποίηση
    await expect(decryptProgress(token, { ...other, kid: inbox.kid })).rejects.toThrow(/κομμένος ή αλλοιωμένος/);
    const tampered = token.slice(0, -6) + (token.endsWith('AAAAAA') ? 'BBBBBB' : 'AAAAAA');
    await expect(decryptProgress(tampered, inbox)).rejects.toThrow();
    await expect(decryptProgress(token.slice(0, 60), inbox)).rejects.toThrow();
  });
});

describe('Συνταγή εξάσκησης (σύνδεσμος/QR)', () => {
  it('μεταφέρει παιχνίδια, λεπτά, μέρες, σημείωση και κλειδί', async () => {
    const inbox = await generateTherapistInboxKey();
    const code = generateChildCode('K7QM');
    const link = await planLink(
      {
        childCode: code,
        activityIds: ['04-sequence-memory', '09-wait-signal', '13-speech-articulation'],
        minutesPerDay: 10,
        daysPerWeek: 4,
        note: 'Πριν τη Μνήμη, 3 ανάσες μπαλόνι.',
        therapistLabel: 'Κέντρο Αλκυόνη',
        issuedAt: '2026-10-28T10:00:00.000Z',
        therapistKey: { x: inbox.publicJwk.x!, y: inbox.publicJwk.y!, kid: inbox.kid },
      },
      'https://www.synapseplay.gr'
    );
    expect(link).toMatch(/^https:\/\/www\.synapseplay\.gr\/plan#c1\./);
    expect(link.length).toBeLessThan(800); // χωράει άνετα σε QR
    const plan = await parsePlanToken(link);
    expect(plan.childCode).toBe(code);
    expect(plan.activityIds).toEqual(['04-sequence-memory', '09-wait-signal', '13-speech-articulation']);
    expect(plan.minutesPerDay).toBe(10);
    expect(plan.daysPerWeek).toBe(4);
    expect(plan.therapistLabel).toBe('Κέντρο Αλκυόνη');
    expect(plan.therapistKey?.kid).toBe(inbox.kid);
  });

  it('απορρίπτει κομμένο ή πειραγμένο σύνδεσμο', async () => {
    await expect(parsePlanToken('https://www.synapseplay.gr/plan#c1.abc')).rejects.toThrow();
    await expect(parsePlanToken('τίποτα')).rejects.toThrow(/δεν είναι έγκυρος/);
  });

  it('μετρά την εβδομάδα από Δευτέρα και προτείνει το λιγότερο παιγμένο', () => {
    const now = new Date(2026, 9, 29, 18, 0); // Πέμπτη 29/10/2026
    expect(weekStartKey(now)).toBe('2026-10-26');
    const plan = {
      childCode: 'X',
      activityIds: ['04-sequence-memory', '09-wait-signal'] as const,
      minutesPerDay: 10 as const,
      daysPerWeek: 3,
      issuedAt: '',
    };
    const p = planWeekProgress({ ...plan, activityIds: [...plan.activityIds] }, [
      log({ dateKey: '2026-10-26' }),
      log({ dateKey: '2026-10-29', durationSeconds: 300 }),
      log({ dateKey: '2026-10-20' }), // προηγούμενη εβδομάδα
    ], 'kid-1', now, '2026-10-29');
    expect(p.daysDone).toBe(2);
    expect(p.minutesToday).toBe(5);
    expect(p.nextActivityId).toBe('09-wait-signal');
  });
});

describe('Κήπος, εποχές, αποστολές, «τι να πείτε»', () => {
  it('ο κήπος μόνο μεγαλώνει: 6 βήματα ανά φυτό, η αποστολή μετρά 2', () => {
    expect(computeGarden(0, 0).grownPlants).toBe(0);
    expect(gardenEncouragementEl(computeGarden(0, 0))).toMatch(/πρώτο σπόρο/);
    const g = computeGarden(4, 1);
    expect(g.steps).toBe(6);
    expect(g.grownPlants).toBe(1);
    expect(g.visitors).toEqual(['🦋']);
    expect(computeGarden(200, 0).plots.length).toBeLessThanOrEqual(12);
  });

  it('Ορθόδοξο Πάσχα και εποχές', () => {
    const e26 = orthodoxEaster(2026);
    expect([e26.getMonth() + 1, e26.getDate()]).toEqual([4, 12]);
    const e27 = orthodoxEaster(2027);
    expect([e27.getMonth() + 1, e27.getDate()]).toEqual([5, 2]);
    expect(currentSeason(new Date(2026, 3, 10)).id).toBe('easter');
    expect(currentSeason(new Date(2026, 1, 23)).id).toBe('carnival'); // Καθαρά Δευτέρα 2026
    expect(currentSeason(new Date(2026, 11, 24)).id).toBe('holidays');
    expect(currentSeason(new Date(2026, 8, 15)).id).toBe('school');
    expect(currentSeason(new Date(2026, 9, 28)).id).toBe('autumn');
    expect(currentSeason(new Date(2026, 6, 1)).id).toBe('summer');
  });

  it('το παιχνίδι της εβδομάδας αλλάζει κάθε εβδομάδα και περνά από όλα', () => {
    expect(isoWeek(new Date(2026, 9, 28)).week).toBe(44);
    const seen = new Set<string>();
    for (let w = 0; w < ACTIVITIES.length; w++) seen.add(gameOfTheWeek(new Date(2026, 0, 5 + w * 7)).id);
    expect(seen.size).toBe(ACTIVITIES.length);
  });

  it('μία αποστολή τη μέρα, ταιριαστή στο παιχνίδι, χωρίς επανάληψη μέσα στην εβδομάδα', () => {
    const m = pickHomeMission({ activityId: '09-wait-signal', ageBand: '6-8', dateKey: '2026-10-28', now: new Date(2026, 9, 28) });
    expect(m.id.startsWith('ic-') || m.id.startsWith('se-')).toBe(true);
    const rec = {
      id: 'a',
      missionId: m.id,
      emoji: m.emoji,
      textEl: m.youngEl,
      offeredAt: new Date(2026, 9, 28).toISOString(),
      dateKey: '2026-10-28',
      status: 'accepted' as const,
    };
    expect(canOfferMissionToday([rec], '2026-10-28')).toBe(false);
    expect(canOfferMissionToday([{ ...rec, status: 'not-today' }], '2026-10-28')).toBe(true);
    expect(pendingMissions([rec], new Date(2026, 9, 29))).toHaveLength(1);
    expect(pendingMissions([rec], new Date(2026, 10, 5))).toHaveLength(0);
    const again = pickHomeMission({
      activityId: '09-wait-signal',
      ageBand: '6-8',
      dateKey: '2026-10-28',
      history: [rec],
      now: new Date(2026, 9, 28),
    });
    expect(again.id).not.toBe(m.id);
  });

  it('έπαινος για την προσπάθεια, ανάλογα με το τι έγινε', () => {
    const base = { activityId: '09-wait-signal' as const, hintsUsed: 0, errorsCount: 0, impulsiveTapsAbsorbed: 0, durationSeconds: 90, totalRounds: 5 };
    expect(buildAfterSessionTalk({ ...base, impulsiveTapsAbsorbed: 4 }).praiseEl).toMatch(/περιμένεις/);
    expect(buildAfterSessionTalk({ ...base, errorsCount: 4 }).praiseEl).toMatch(/επιμονή/);
    expect(buildAfterSessionTalk(base).questionEl).toMatch(/περιμένεις/);
    expect(buildAfterSessionTalk(base).praiseEl).not.toMatch(/έξυπν/);
  });
});

describe('Υπενθυμίσεις & ερωτηματολόγιο', () => {
  it('φτιάχνει έγκυρο .ics με επανάληψη και διπλωμένες γραμμές UTF-8', () => {
    const ics = buildIcs(
      [
        {
          uid: 'play-kid-1',
          title: 'SynapsePlay: 10 λεπτά εξάσκηση με τη Μαρία',
          description: 'Το πρόγραμμα της εβδομάδας από τον θεραπευτή. Ανοίξτε την εφαρμογή, παίξτε μαζί, κλείστε με την αποστολή στο σπίτι.',
          url: 'https://www.synapseplay.gr/app',
          time: '18:30',
          days: ['MO', 'WE', 'FR'],
          durationMinutes: 15,
        },
      ],
      new Date(2026, 9, 29, 9, 0)
    );
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(ics).toContain('DTSTART:20261030T183000');
    expect(ics).toContain('DTEND:20261030T184500');
    expect(ics).toContain('TRIGGER:PT0M');
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(foldLine('α'.repeat(100)).split('\r\n ').join('')).toBe('α'.repeat(100));
  });

  it('ερωτηματολόγιο κάθε 28 μέρες και αλλαγή από την αρχή', () => {
    expect(isCheckInDue([], '2026-10-28')).toBe(true);
    const a = { id: 'a', dateKey: '2026-10-01', answers: [2, 2, 3, 2, 3] as [number, number, number, number, number] };
    const b = { id: 'b', dateKey: '2026-10-29', answers: [3, 3, 3, 4, 3] as [number, number, number, number, number] };
    expect(isCheckInDue([a], '2026-10-20')).toBe(false);
    expect(isCheckInDue([a], '2026-10-29')).toBe(true);
    expect(checkInChange([b, a])).toEqual([1, 1, 0, 2, 0]);
  });
});
