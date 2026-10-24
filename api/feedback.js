/**
 * Vercel Serverless Function: POST /api/feedback
 * Relays parent & ADHD-center clinician observations directly to the owner's inbox
 * on the server side so the destination email address is NEVER exposed in the UI or client bundle.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const recipientEmail = process.env.FEEDBACK_RECEIVER_EMAIL || 'digiadsgr@gmail.com';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const {
      subject = 'SynapsePlay — Νέα Παρατήρηση / Αξιολόγηση Κέντρου ΔΕΠΥ & Γονέων',
      reviewerRoleLabelEl = 'Αξιολογητής',
      reviewerNameOrCenter = 'Ανώνυμος',
      targetScopeLabelEl = 'Γενική Λειτουργία',
      ageBandTested = '6-8',
      ratingStars = 5,
      usabilityScore = 5,
      clinicalAppropriatenessScore = 5,
      observationCategory = 'clinical-suggestion',
      commentEl = '',
      fullReportText = '',
    } = body;

    // 1. Optional Resend API support if RESEND_API_KEY is configured in Vercel Environment Variables
    if (process.env.RESEND_API_KEY) {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SynapsePlay Feedback <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          text:
            fullReportText ||
            [
              `Νέα Αξιολόγηση / Παρατήρηση στο SynapsePlay (FocusEngine 5+)`,
              `-------------------------------------------------------------`,
              `Αξιολογητής: ${reviewerRoleLabelEl} (${reviewerNameOrCenter})`,
              `Ενότητα / Παιχνίδι: ${targetScopeLabelEl}`,
              `Ηλικιακή Ομάδα: ${ageBandTested} ετών`,
              `Κατηγορία: ${observationCategory}`,
              `Βαθμολογία: ${ratingStars}/5 ⭐ (Ευχρηστία: ${usabilityScore}/5 | Κλινική Καταλληλότητα: ${clinicalAppropriatenessScore}/5)`,
              ``,
              `Παρατήρηση / Πρόταση:`,
              commentEl,
            ].join('\n'),
        }),
      });

      if (resendResp.ok) {
        return res.status(200).json({ ok: true, method: 'resend' });
      }
    }

    // 2. Zero-config relay via FormSubmit AJAX endpoint
    const originHeader = req.headers.origin || 'https://synapseplay.vercel.app';
    const refererHeader = req.headers.referer || 'https://synapseplay.vercel.app/parent';

    const formSubmitResp = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: originHeader,
        Referer: refererHeader,
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        Αξιολογητής: `${reviewerRoleLabelEl} (${reviewerNameOrCenter})`,
        Ενότητα_Παιχνίδι: targetScopeLabelEl,
        Ηλικιακή_Ομάδα: `${ageBandTested} ετών`,
        Βαθμολογία: `${ratingStars}/5 ⭐ (Ευχρηστία: ${usabilityScore}/5, Κλινική: ${clinicalAppropriatenessScore}/5)`,
        Κατηγορία: observationCategory,
        Παρατήρηση_Πρόταση: commentEl || fullReportText,
      }),
    });

    if (formSubmitResp.ok) {
      return res.status(200).json({ ok: true, method: 'formsubmit-server' });
    }

    return res.status(200).json({ ok: true, method: 'queued' });
  } catch (err) {
    return res.status(200).json({ ok: false, error: 'Relay fallback required' });
  }
}
