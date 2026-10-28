import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getGdprConsentAck } from './components/GdprConsentBanner';
import { hasAnalyticsConsent, loadGtmAfterConsent } from './utils/analyticsConsent';
import { captureIncomingLink } from './utils/incomingLinks';
import './index.css';

// Σύνδεσμοι προγράμματος/προόδου: τα δεδομένα του #fragment φυλάγονται και σβήνονται
// από τη διεύθυνση ΠΡΙΝ φορτώσουν στατιστικά.
captureIncomingLink();

if (hasAnalyticsConsent(getGdprConsentAck())) {
  loadGtmAfterConsent();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
