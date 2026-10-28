import type { ActivitySessionLog } from '../types/domain';
import type { ChildMicroProfile } from './childProfileLearningEngine';
import { formatLogAccuracy, summarizeRecentAccuracy } from './progressMetrics';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Escapes text for safe insertion into the printable HTML report (nicknames are user input). */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * CSV cell: quotes, and neutralises spreadsheet formula injection
 * (cells starting with = + - @ are prefixed with an apostrophe).
 */
export function csvCell(value: unknown): string {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function profileName(profiles: ChildMicroProfile[], log: ActivitySessionLog): string {
  return (
    profiles.find((p) => p.id === log.childProfileId)?.nickname ?? log.childNickname ?? '—'
  );
}

function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}′ ${s}″` : `${s}″`;
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

const CSV_HEADERS = [
  'Ημερομηνία',
  'Ώρα',
  'Παιδί',
  'Ηλικία',
  'Δραστηριότητα',
  'Γύροι',
  'Λάθη',
  'Ακρίβεια',
  'Βοήθειες',
  'Διάρκεια (δευτ.)',
  'Διάμεσος χρόνος γύρου (δευτ.)',
  'Μέτρηση',
  'Πού',
];

/**
 * Session logs → CSV (UTF-8 with BOM, ';' separator — opens correctly in Greek Excel).
 * Pass childProfileId to export one child only.
 */
export function sessionLogsToCsv(
  logs: ActivitySessionLog[],
  profiles: ChildMicroProfile[],
  childProfileId?: string
): string {
  const rows = logs
    .filter((l) => !childProfileId || l.childProfileId === childProfileId)
    .map((l) => {
      const d = new Date(l.timestamp);
      return [
        l.dateKey,
        isNaN(d.getTime()) ? '' : d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }),
        profileName(profiles, l),
        l.ageBand ?? '',
        l.activityTitleEl,
        `${l.completedRounds}/${l.totalRounds}`,
        typeof l.errorsCount === 'number' ? l.errorsCount : '',
        formatLogAccuracy(l),
        l.hintsUsed,
        l.durationSeconds,
        typeof l.medianRoundMs === 'number' ? (l.medianRoundMs / 1000).toFixed(1) : '',
        l.measurement === 'self-report' ? 'αυτοαναφορά' : 'μετρήσιμο',
        l.source === 'home' ? 'σπίτι' : 'συσκευή',
      ]
        .map(csvCell)
        .join(';');
    });
  return '﻿' + [CSV_HEADERS.map(csvCell).join(';'), ...rows].join('\r\n');
}

/* ------------------------------------------------------------------ */
/* Printable report (browser "Print → Save as PDF")                    */
/* ------------------------------------------------------------------ */

export function buildChildReportHtml(
  profile: ChildMicroProfile,
  logs: ActivitySessionLog[],
  generatedAt: Date = new Date()
): string {
  const own = logs.filter((l) => !l.childProfileId || l.childProfileId === profile.id);
  const summary = summarizeRecentAccuracy(own, profile.id, 10);
  const dates = own.map((l) => l.dateKey).sort();
  const period = dates.length ? `${dates[0]} — ${dates[dates.length - 1]}` : '—';
  const totalSec = own.reduce((sum, l) => sum + l.durationSeconds, 0);

  const rows = own
    .map(
      (l) => `<tr>
        <td>${escapeHtml(l.dateKey)}</td>
        <td>${escapeHtml(l.activityTitleEl)}</td>
        <td>${escapeHtml(`${l.completedRounds}/${l.totalRounds}`)}</td>
        <td>${escapeHtml(typeof l.errorsCount === 'number' ? l.errorsCount : '—')}</td>
        <td>${escapeHtml(formatLogAccuracy(l))}</td>
        <td>${escapeHtml(l.hintsUsed)}</td>
        <td>${escapeHtml(formatSeconds(l.durationSeconds))}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="el"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Αναφορά εξάσκησης — ${escapeHtml(profile.nickname)}</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2C3539;margin:32px;font-size:13px}
  h1{font-size:20px;margin:0 0 4px} .muted{color:#5c6b70}
  .kpis{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
  .kpi{border:1px solid #cfc6b3;border-radius:10px;padding:10px 14px;min-width:140px}
  .kpi b{display:block;font-size:18px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border-bottom:1px solid #e3dccb;padding:6px 4px;text-align:left}
  th{font-size:12px} .note{margin-top:18px;font-size:11px;border-top:1px solid #cfc6b3;padding-top:8px}
  .actions{margin-bottom:16px;padding:8px 12px;border:1px dashed #4A6B82;border-radius:8px;font-size:12px}
  @media print{.actions{display:none} body{margin:12mm}}
</style></head>
<body>
  <div class="actions">🖨️ Για PDF: Εκτύπωση → «Αποθήκευση ως PDF» (στο tablet: Κοινοποίηση → Εκτύπωση).</div>
  <h1>Αναφορά εξάσκησης — ${escapeHtml(profile.nickname)}</h1>
  <div class="muted">Ηλικιακή ομάδα: ${escapeHtml(profile.ageBand)} ετών · Περίοδος: ${escapeHtml(period)} · Δημιουργήθηκε: ${escapeHtml(
    generatedAt.toLocaleString('el-GR')
  )}</div>
  <div class="kpis">
    <div class="kpi">Ολοκληρωμένα παιχνίδια<b>${own.length}</b></div>
    <div class="kpi">Συνολικός χρόνος<b>${escapeHtml(formatSeconds(totalSec))}</b></div>
    <div class="kpi">Ακρίβεια (τελευταία ${summary.measuredCount} μετρήσιμα)<b>${
      summary.accuracyPct === null ? '—' : `${summary.accuracyPct}%`
    }</b></div>
    <div class="kpi">Παιχνίδια κίνησης (αυτοαναφορά)<b>${summary.selfReportCount}</b></div>
  </div>
  <table>
    <thead><tr><th>Ημερομηνία</th><th>Δραστηριότητα</th><th>Γύροι</th><th>Λάθη</th><th>Ακρίβεια</th><th>Βοήθειες</th><th>Διάρκεια</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">Δεν υπάρχουν καταγραφές.</td></tr>'}</tbody>
  </table>
  <p class="note">Ακρίβεια = σωστοί γύροι / (σωστοί γύροι + λάθη). «Αυτοαναφορά» = παιχνίδια κίνησης που η εφαρμογή δεν μπορεί να ελέγξει.
  Η αναφορά περιγράφει την εξάσκηση μέσα στην εφαρμογή και <b>δεν αποτελεί κλινική αξιολόγηση ή διάγνωση</b>.</p>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Browser actions                                                     */
/* ------------------------------------------------------------------ */

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Opens the printable report in a new tab (user then prints / saves as PDF). */
export function openPrintableReport(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  // Note: passing 'noopener' makes window.open() return null, so we detach the opener manually
  const win = window.open(url, '_blank');
  if (win) {
    // No inline script in the report (CSP-safe): trigger the print dialog from here
    win.addEventListener('load', () => {
      try {
        win.print();
      } catch {
        // user can still print manually
      }
    });
    win.opener = null;
  } else {
    // Pop-up blocked → fall back to downloading the HTML file
    downloadTextFile('synapseplay-report.html', html, 'text/html;charset=utf-8');
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function safeFilePart(name: string): string {
  return name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'paidi';
}
