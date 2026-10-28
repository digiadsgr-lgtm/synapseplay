/**
 * Υπενθυμίσεις (βελτίωση 6) ΧΩΡΙΣ server και χωρίς push: αρχείο ημερολογίου (.ics) που ο γονιός
 * προσθέτει στο ημερολόγιο του κινητού. Το κινητό κάνει την ειδοποίηση, όχι η εφαρμογή.
 */

export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export const WEEKDAYS: { code: WeekdayCode; labelEl: string }[] = [
  { code: 'MO', labelEl: 'Δε' },
  { code: 'TU', labelEl: 'Τρ' },
  { code: 'WE', labelEl: 'Τε' },
  { code: 'TH', labelEl: 'Πε' },
  { code: 'FR', labelEl: 'Πα' },
  { code: 'SA', labelEl: 'Σα' },
  { code: 'SU', labelEl: 'Κυ' },
];

/** Προτεινόμενες μέρες για Ν μέρες/εβδομάδα (απλωμένες στην εβδομάδα). */
export function defaultDaysFor(daysPerWeek: number): WeekdayCode[] {
  const presets: Record<number, WeekdayCode[]> = {
    2: ['TU', 'FR'],
    3: ['MO', 'WE', 'FR'],
    4: ['MO', 'TU', 'TH', 'FR'],
    5: ['MO', 'TU', 'WE', 'TH', 'FR'],
    6: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
    7: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
  };
  return presets[Math.min(7, Math.max(2, Math.round(daysPerWeek)))];
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Δίπλωση γραμμών στα 75 bytes (RFC 5545), χωρίς να σπάει χαρακτήρας UTF-8. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = '';
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // οι συνέχειες ξεκινούν με κενό
    if (curBytes + b > limit) {
      parts.push(cur);
      cur = '';
      curBytes = 0;
    }
    cur += ch;
    curBytes += b;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function localStamp(d: Date, hh: number, mm: number): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`;
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export interface ReminderEvent {
  uid: string;
  title: string;
  description: string;
  url?: string;
  /** «18:00» */
  time: string;
  days: WeekdayCode[];
  durationMinutes: number;
}

/** Ημερομηνία της πρώτης επόμενης μέρας που ταιριάζει (από σήμερα). */
function firstOccurrence(days: WeekdayCode[], from: Date): Date {
  const order: WeekdayCode[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (days.includes(order[d.getDay()])) return d;
  }
  return from;
}

export function buildIcs(events: ReminderEvent[], now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SynapsePlay//Ypenthymiseis//EL', 'CALSCALE:GREGORIAN'];
  for (const ev of events) {
    if (ev.days.length === 0) continue;
    const [hh, mm] = ev.time.split(':').map((x) => parseInt(x, 10));
    const start = firstOccurrence(ev.days, now);
    const endMin = hh * 60 + mm + ev.durationMinutes;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}@synapseplay.gr`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${localStamp(start, hh, mm)}`,
      `DTEND:${localStamp(start, Math.floor(endMin / 60) % 24, endMin % 60)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${ev.days.join(',')}`,
      `SUMMARY:${escapeText(ev.title)}`,
      `DESCRIPTION:${escapeText(ev.description + (ev.url ? `\n${ev.url}` : ''))}`
    );
    if (ev.url) lines.push(`URL:${ev.url}`);
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(ev.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Κοινοποίηση (κινητό → «Ημερολόγιο») ή λήψη αρχείου. */
export async function deliverIcs(filename: string, ics: string): Promise<'shared' | 'downloaded'> {
  const file = typeof File !== 'undefined' ? new File([ics], filename, { type: 'text/calendar' }) : null;
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { canShare?: (d: ShareData) => boolean }) : null;
  if (file && nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Υπενθύμιση SynapsePlay' });
      return 'shared';
    } catch {
      // ακύρωση ή αποτυχία → λήψη
    }
  }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
