import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getGdprConsentAck } from './components/GdprConsentBanner';
import { hasAnalyticsConsent, loadGtmAfterConsent } from './utils/analyticsConsent';
import './index.css';

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
