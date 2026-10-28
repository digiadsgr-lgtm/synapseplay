import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NoTherapistOptions } from '../components/NoTherapistOptions';
import {
  centerCodeFromLicenseRef,
  generateChildCode,
  generateSelfChildCode,
  isSelfChildCode,
  isValidChildCode,
  randomCenterCode,
} from '../utils/childCode';

describe('Γονείς χωρίς θεραπευτή', () => {
  it('ο κωδικός «χωρίς θεραπευτή» είναι έγκυρος και αναγνωρίζεται', () => {
    const c = generateSelfChildCode();
    expect(c.startsWith('SELF-')).toBe(true);
    expect(isValidChildCode(c)).toBe(true);
    expect(isSelfChildCode(c)).toBe(true);
    expect(isSelfChildCode(generateChildCode('K7QM'))).toBe(false);
    expect(() => generateChildCode('SELF')).toThrow();
    for (let i = 0; i < 300; i++) expect(randomCenterCode()).not.toBe('SELF');
    expect(centerCodeFromLicenseRef('x')).not.toBe('SELF');
  });

  it('«Δεν θέλω θεραπευτή» καλεί την αυτόματη ενεργοποίηση', () => {
    const onNo = vi.fn();
    render(<NoTherapistOptions onNoTherapist={onNo} defaultAgeBand="6-8" />);
    fireEvent.click(screen.getByTestId('no-therapist-btn'));
    expect(onNo).toHaveBeenCalledTimes(1);
  });

  it('η φόρμα «Βρείτε θεραπευτή» θέλει επικοινωνία, περιοχή και συναίνεση και στέλνει στο /api/feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<NoTherapistOptions onNoTherapist={() => {}} defaultAgeBand="6-8" />);
    fireEvent.click(screen.getByTestId('find-therapist-btn'));
    const submit = screen.getByTestId('find-therapist-submit');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByTestId('find-therapist-contact'), { target: { value: 'goneas@example.com' } });
    fireEvent.change(screen.getByTestId('find-therapist-area'), { target: { value: 'Ρέθυμνο' } });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByTestId('find-therapist-consent'));
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByTestId('find-therapist-sent')).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/feedback');
    const body = JSON.parse(init.body);
    expect(body.reviewerRole).toBe('parent');
    expect(body.commentEl).toContain('ΑΙΤΗΜΑ ΕΥΡΕΣΗΣ ΘΕΡΑΠΕΥΤΗ');
    expect(body.commentEl).toContain('Ρέθυμνο');
    vi.unstubAllGlobals();
  });
});
