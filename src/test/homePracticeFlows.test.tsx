import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AppProvider } from '../context/AppContext';
import { AfterActivityHome } from '../components/AfterActivityHome';
import { HubGardenCard, HubPendingMissions } from '../components/ChildHubHomePractice';
import { captureIncomingLink, peekIncoming, clearIncoming } from '../utils/incomingLinks';

const originalClipboard = navigator.clipboard;

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
});

function mockClipboard(): string[] {
  const copied: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(async (t: string) => void copied.push(t)) },
    configurable: true,
  });
  return copied;
}

describe('Αποστολή στο σπίτι, επιβεβαίωση γονιού και κήπος', () => {
  it('το παιδί δέχεται την αποστολή, ο γονιός επιβεβαιώνει, ο κήπος παίρνει επισκέπτη', async () => {
    render(
      <AppProvider>
        <MemoryRouter>
          <AfterActivityHome
            talk={{
              activityId: '09-wait-signal',
              hintsUsed: 0,
              errorsCount: 0,
              impulsiveTapsAbsorbed: 4,
              durationSeconds: 80,
              totalRounds: 5,
            }}
          />
          <HubPendingMissions />
          <HubGardenCard />
        </MemoryRouter>
      </AppProvider>
    );
    // περιμένουμε να φορτώσουν τα προφίλ (στην εφαρμογή το παιχνίδι διαρκεί λεπτά)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByTestId('home-mission-offer')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('after-talk-toggle-btn'));
    expect(screen.getByTestId('after-talk-box')).toHaveTextContent('περιμένεις');

    fireEvent.click(screen.getByTestId('home-mission-accept-btn'));
    await waitFor(() => expect(screen.getByTestId('home-mission-accepted')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('hub-pending-missions')).toBeInTheDocument());

    const confirm = screen.getAllByTestId(/^hub-mission-parent-confirm-btn-/)[0];
    const id = confirm.getAttribute('data-testid')!.replace('hub-mission-parent-confirm-btn-', '');
    // Το παιδί δεν μπορεί να το «επιβεβαιώσει» χωρίς την πύλη γονιού
    expect(screen.queryByTestId(`hub-mission-done-btn-${id}`)).not.toBeInTheDocument();
    fireEvent.click(confirm);
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));
    fireEvent.click(await screen.findByTestId(`hub-mission-done-btn-${id}`));
    await waitFor(() => expect(screen.queryByTestId('hub-pending-missions')).not.toBeInTheDocument());
    expect(screen.getByTestId('hub-garden-plots')).toHaveTextContent('🦋');
  });
});

describe('Πρόγραμμα θεραπευτή (QR) → γονιός → κρυπτογραφημένη πρόοδος → θεραπευτής', () => {
  it('ολόκληρος ο κύκλος χωρίς server', async () => {
    const copied = mockClipboard();
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <App />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));
    await screen.findByTestId('therapist-home-practice-section');

    // 1. Κωδικός παιδιού στο πρώτο προφίλ
    const codeBtn = screen.getAllByTestId(/^pro-tools-new-code-btn-/)[0];
    const pid = codeBtn.getAttribute('data-testid')!.replace('pro-tools-new-code-btn-', '');
    fireEvent.click(codeBtn);
    fireEvent.click(await screen.findByTestId(`therapist-plan-btn-${pid}`));

    // 2. Θεραπευτής: πρόγραμμα με 2 παιχνίδια → QR + σύνδεσμος
    fireEvent.click(screen.getByTestId('plan-game-04-sequence-memory'));
    fireEvent.click(screen.getByTestId('plan-game-09-wait-signal'));
    fireEvent.change(screen.getByTestId('plan-label-input'), { target: { value: 'Κέντρο Αλκυόνη' } });
    fireEvent.click(screen.getByTestId('plan-create-btn'));
    await screen.findByTestId('plan-result');
    fireEvent.click(screen.getByTestId('plan-copy-btn'));
    await waitFor(() => expect(copied.length).toBe(1));
    const planUrl = copied[0].match(/https?:\/\/\S+\/plan#c1\.\S+/)![0];
    await waitFor(() => expect(screen.getByTestId('therapist-inbox-key-id')).toBeInTheDocument());

    // 3. Γονιός: αφαιρεί και ξαναβάζει το πρόγραμμα από τον σύνδεσμο
    fireEvent.click(await screen.findByTestId(`parent-plan-remove-${pid}`));
    await waitFor(() => expect(screen.queryByTestId(`parent-plan-${pid}`)).not.toBeInTheDocument());
    fireEvent.change(screen.getByTestId('parent-paste-plan-input'), { target: { value: planUrl } });
    fireEvent.click(screen.getByTestId('parent-open-plan-btn'));
    expect(await screen.findByTestId('incoming-plan-confirm')).toHaveTextContent('Κέντρο Αλκυόνη');
    fireEvent.click(screen.getByTestId('incoming-plan-accept-btn'));
    await waitFor(() => expect(screen.getByTestId(`parent-plan-${pid}`)).toBeInTheDocument());

    // 4. Ερωτηματολόγιο γονιού
    fireEvent.click(screen.getByTestId('parent-checkin-open-btn'));
    for (const q of ['start', 'finish', 'wait', 'calm', 'switch']) fireEvent.click(screen.getByTestId(`checkin-${q}-3`));
    fireEvent.click(screen.getByTestId('parent-checkin-submit-btn'));
    await screen.findByTestId('parent-checkin-saved');

    // 5. Γονιός: κρυπτογραφημένη αποστολή (χωρίς navigator.share → αντιγραφή)
    fireEvent.click(await screen.findByTestId(`share-progress-secure-btn-${pid}`));
    const linkBox = (await screen.findByTestId('share-progress-link-text')) as HTMLTextAreaElement;
    expect(linkBox.value).toMatch(/\/receive#p1\./);
    expect(linkBox.value).not.toContain('Μικρός');

    // 6. Θεραπευτής: εισαγωγή από επικόλληση
    fireEvent.change(screen.getByTestId('therapist-paste-progress-input'), { target: { value: linkBox.value } });
    fireEvent.click(screen.getByTestId('therapist-import-progress-link-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('therapist-home-message')).toHaveTextContent(/Ενημερώθηκε .*1 ερωτηματολόγια/)
    );
    expect(screen.getByTestId(`therapist-home-summary-${pid}`)).toHaveTextContent('Ερωτηματολόγιο γονιού');
  });

  it('ο σύνδεσμος /receive κρατιέται και σβήνεται από τη διεύθυνση πριν από οτιδήποτε άλλο', () => {
    window.history.replaceState(null, '', '/receive#p1.ABCDEFGH.xyz');
    expect(captureIncomingLink()).toBe('progress');
    expect(window.location.hash).toBe('');
    expect(peekIncoming('progress')).toBe('p1.ABCDEFGH.xyz');
    clearIncoming('progress');
    window.history.replaceState(null, '', '/plan#κάτι-άλλο');
    expect(captureIncomingLink()).toBeNull();
    expect(window.location.hash).toBe('');
    window.history.replaceState(null, '', '/');
  });
});
