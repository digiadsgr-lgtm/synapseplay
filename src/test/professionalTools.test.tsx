import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { buildChildReportHtml, csvCell, escapeHtml, sessionLogsToCsv } from '../utils/reportExport';
import { BACKUP_FORMAT, parseBackup } from '../db/database';
import { createDefaultChildProfile } from '../utils/childProfileLearningEngine';
import type { ActivitySessionLog } from '../types/domain';

const log = (over: Partial<ActivitySessionLog> = {}): ActivitySessionLog => ({
  timestamp: '2026-10-26T10:00:00Z',
  dateKey: '2026-10-26',
  activityId: '01-visual-search',
  activityTitleEl: 'Οπτική Αναζήτηση',
  categoryId: 'detective-eyes',
  durationSeconds: 75,
  completedRounds: 3,
  totalRounds: 3,
  hintsUsed: 1,
  impulsiveTapsAbsorbed: 0,
  errorsCount: 1,
  seatedModeUsed: false,
  ...over,
});

describe('Professional tools: reports, CSV, backup', () => {
  it('CSV: BOM, Greek headers, ";" separator and formula-injection protection', () => {
    const p = { ...createDefaultChildProfile('6-8'), id: 'c1', nickname: '=HYPERLINK("x")' };
    const csv = sessionLogsToCsv([log({ childProfileId: 'c1' })], [p]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"Ημερομηνία";"Ώρα"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"75%"');
    expect(csvCell('+1')).toBe(`"'+1"`);
  });

  it('printable report escapes user input and states it is not a clinical assessment', () => {
    const p = { ...createDefaultChildProfile('6-8'), id: 'c1', nickname: '<img src=x onerror=alert(1)>' };
    const html = buildChildReportHtml(p, [log({ childProfileId: 'c1' })]);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain(escapeHtml('<img src=x onerror=alert(1)>'));
    expect(html).toContain('δεν αποτελεί κλινική αξιολόγηση');
  });

  it('backup parser rejects foreign / broken files and accepts valid ones', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ format: 'other', version: 1 }))).toThrow();
    const valid = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-10-26T10:00:00Z',
      childProfiles: [createDefaultChildProfile('6-8')],
      sessionLogs: [log()],
    };
    expect(parseBackup(JSON.stringify(valid)).childProfiles).toHaveLength(1);
    expect(() =>
      parseBackup(JSON.stringify({ ...valid, sessionLogs: [{ evil: true }] }))
    ).toThrow('κατεστραμμένο');
  });

  it('parent area shows the tools and renames / re-ages a profile', async () => {
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <App />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));
    await waitFor(() => {
      expect(screen.getByTestId('professional-tools-section')).toBeInTheDocument();
    });
    const nameInput = screen.getAllByTestId(/^pro-tools-name-input-/)[0] as HTMLInputElement;
    const profileId = nameInput.getAttribute('data-testid')!.replace('pro-tools-name-input-', '');
    fireEvent.change(nameInput, { target: { value: 'Νίκος' } });
    fireEvent.blur(nameInput);
    fireEvent.change(screen.getByTestId(`pro-tools-age-select-${profileId}`), {
      target: { value: '8-10' },
    });
    await waitFor(() => {
      expect(screen.getByTestId(`pro-tools-age-select-${profileId}`)).toHaveValue('8-10');
    });
    expect(screen.getByTestId(`pro-tools-report-btn-${profileId}`)).toBeInTheDocument();
    expect(screen.getByTestId('pro-tools-backup-btn')).toBeInTheDocument();
  });
});
