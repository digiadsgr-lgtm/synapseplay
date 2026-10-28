import React, { useState } from 'react';
import type { AgeBandId } from '../data/ageProtocols';

const AGE_OPTIONS: AgeBandId[] = ['4-5', '5-6', '6-8', '8-10', '10-12'];
const CONTACT_EMAIL = 'digiadsgr@gmail.com';

interface Props {
  /** «Δεν θέλω θεραπευτή» → ο γονιός παίρνει αυτόματα κωδικό ενεργοποίησης. */
  onNoTherapist: () => void;
  defaultAgeBand: AgeBandId;
}

/**
 * Για γονείς χωρίς κωδικό παιδιού:
 *   1) «Βρείτε θεραπευτή» — σύντομη φόρμα· το αίτημα φτάνει με email στο SynapsePlay
 *      μέσω του υπάρχοντος /api/feedback (κανένα νέο endpoint, καμία αλλαγή στη φόρμα παρατηρήσεων).
 *   2) «Δεν θέλω θεραπευτή» — αυτόματος κωδικός ενεργοποίησης (κέντρο SELF).
 */
export const NoTherapistOptions: React.FC<Props> = ({ onNoTherapist, defaultAgeBand }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [area, setArea] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBandId>(defaultAgeBand);
  const [need, setNeed] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const canSend = contact.trim().length >= 5 && area.trim().length >= 2 && consent && status !== 'sending';

  const summary = [
    'ΑΙΤΗΜΑ ΕΥΡΕΣΗΣ ΘΕΡΑΠΕΥΤΗ',
    `Όνομα γονέα: ${name.trim() || '—'}`,
    `Επικοινωνία: ${contact.trim()}`,
    `Περιοχή: ${area.trim()}`,
    `Ηλικία παιδιού: ${ageBand} ετών`,
    `Τι χρειάζεται: ${need.trim() || '—'}`,
    'Ο γονέας συμφώνησε να επικοινωνήσουμε μαζί του για αυτό το αίτημα.',
  ].join('\n');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerRole: 'parent',
          reviewerRoleLabelEl: 'Γονέας — Εύρεση θεραπευτή',
          reviewerNameOrCenter: name.trim() || 'Γονέας',
          targetScopeLabelEl: `Αίτημα εύρεσης θεραπευτή — ${area.trim()}`,
          ageBandTested: ageBand,
          observationCategory: 'therapist-request',
          commentEl: summary,
        }),
      });
      setStatus(r.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div data-testid="no-therapist-options" className="p-3 rounded-xl bg-white border border-slate/50 space-y-2">
      <p className="text-xs font-extrabold text-charcoal">Δεν έχετε θεραπευτή;</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="find-therapist-btn"
          onClick={() => setOpen((v) => !v)}
          className="touch-target px-3 py-2 rounded-xl bg-sage-surface border-2 border-sage text-xs font-extrabold"
        >
          🔎 Βρείτε θεραπευτή
        </button>
        <button
          type="button"
          data-testid="no-therapist-btn"
          onClick={onNoTherapist}
          className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
        >
          Δεν θέλω θεραπευτή — πάρτε κωδικό τώρα
        </button>
      </div>

      {open && status !== 'sent' && (
        <form data-testid="find-therapist-form" onSubmit={(e) => void handleSend(e)} className="space-y-2 pt-1">
          <p className="text-[11px] text-charcoal-muted">
            Θα σας προτείνουμε συνεργαζόμενο θεραπευτή κοντά σας. Ο θεραπευτής σας δίνει τον κωδικό
            παιδιού.
          </p>
          <input
            data-testid="find-therapist-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Όνομα (προαιρετικό)"
            aria-label="Όνομα"
            className="w-full px-3 py-2 rounded-xl border-2 border-slate text-sm"
          />
          <input
            data-testid="find-therapist-contact"
            value={contact}
            maxLength={120}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email ή τηλέφωνο *"
            aria-label="Email ή τηλέφωνο"
            className="w-full px-3 py-2 rounded-xl border-2 border-slate text-sm"
          />
          <div className="flex gap-2">
            <input
              data-testid="find-therapist-area"
              value={area}
              maxLength={80}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Πόλη / περιοχή *"
              aria-label="Πόλη ή περιοχή"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-slate text-sm"
            />
            <select
              value={ageBand}
              aria-label="Ηλικία παιδιού"
              onChange={(e) => setAgeBand(e.target.value as AgeBandId)}
              className="px-2 py-2 rounded-xl border-2 border-slate text-sm"
            >
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a} ετών
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={need}
            maxLength={600}
            onChange={(e) => setNeed(e.target.value)}
            placeholder="Τι θα θέλατε να δουλέψει το παιδί; (προαιρετικό — χωρίς ιατρικά στοιχεία)"
            aria-label="Τι χρειάζεται"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border-2 border-slate text-sm"
          />
          <label className="flex items-start gap-2 text-[11px] text-charcoal">
            <input
              type="checkbox"
              data-testid="find-therapist-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>Συμφωνώ να επικοινωνήσετε μαζί μου μόνο για αυτό το αίτημα.</span>
          </label>
          <button
            type="submit"
            data-testid="find-therapist-submit"
            disabled={!canSend}
            className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-xs font-extrabold disabled:opacity-50"
          >
            {status === 'sending' ? 'Αποστολή…' : 'Αποστολή αιτήματος'}
          </button>
          {status === 'error' && (
            <p role="status" className="text-[11px] font-bold text-terracotta-dark">
              Δεν στάλθηκε. Στείλτε μας email στο{' '}
              <a
                className="underline"
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Εύρεση θεραπευτή')}&body=${encodeURIComponent(summary)}`}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </form>
      )}
      {status === 'sent' && (
        <p role="status" data-testid="find-therapist-sent" className="text-[11px] font-bold text-sage-dark">
          ✅ Λάβαμε το αίτημά σας. Θα επικοινωνήσουμε μαζί σας σύντομα.
        </p>
      )}
    </div>
  );
};

export default NoTherapistOptions;
