import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SynapsePlayLogoMark } from '../components/SynapsePlayLogoMark';
import { clearGdprConsentAck } from '../components/GdprConsentBanner';
import { SOCIAL_LINKS } from '../utils/seoEngine';

export const LegalCompliancePage: React.FC = () => {
  const { settings, childProfiles, sessionLogs, feedbackEntries, wipeAllData } = useApp();
  const [wipeConfirmedMessage, setWipeConfirmedMessage] = useState<string | null>(null);

  const handleExportGdprPortabilityJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      controller: 'DIGIADS (https://digiads.gr)',
      application: 'SynapsePlay (FocusEngine 5+)',
      gdprBasis: 'Article 15 & Article 20 GDPR ΓÇö Right of Access & Data Portability (Local Device Data)',
      localDeviceData: {
        settings,
        childProfiles,
        activityHistory: sessionLogs,
        feedbackNotes: feedbackEntries,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapseplay-gdpr-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGdprRightToErasure = async () => {
    await wipeAllData();
    clearGdprConsentAck();
    setWipeConfirmedMessage(
      '╬î╬╗╬▒ ╧ä╬▒ ╧ä╬┐╧Ç╬╣╬║╬¼ ╬┤╬╡╬┤╬┐╬╝╬¡╬╜╬▒ ╧ä╬╖╧é ╧â╧à╧â╬║╬╡╧à╬«╧é (╧Ç╧ü╬┐╧å╬»╬╗, ╬╣╧â╧ä╬┐╧ü╬╣╬║╧î, ╧ü╧à╬╕╬╝╬»╧â╬╡╬╣╧é ╬║╬▒╬╣ ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é) ╬┤╬╣╬▒╬│╧ü╬¼╧å╬╖╬║╬▒╬╜ ╬┐╧ü╬╣╧â╧ä╬╣╬║╬¼ ╧â╧ì╬╝╧å╧ë╬╜╬▒ ╬╝╬╡ ╧ä╬┐ ╬å╧ü╬╕╧ü╬┐ 17 ╧ä╬┐╧à ╬ô╬Ü╬á╬ö (╬ö╬╣╬║╬▒╬»╧ë╬╝╬▒ ╧â╧ä╬╖ ╬¢╬«╬╕╬╖).'
    );
  };

  return (
    <div
      data-testid="legal-compliance-page"
      className="min-h-screen bg-[#EFE8D8] text-[#2C3539] font-sans pb-16"
    >
      {/* Top Bar */}
      <header className="border-b border-[#2C3539]/15 bg-[#FAF6EE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <SynapsePlayLogoMark sizeClassName="w-11 h-11" />
            <div>
              <span className="text-lg font-extrabold text-[#2C3539] group-hover:text-[#4A6B82] transition-colors">
                SynapsePlay
              </span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold">
                ╬¥╬┐╬╝╬╣╬║╧î ╬Ü╬¡╬╜╧ä╧ü╬┐ &amp; GDPR
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              data-testid="legal-back-home-link"
              className="touch-target px-4 py-2 rounded-2xl bg-white border border-[#2C3539]/20 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-[#EFE8D8]"
            >
              ΓåÉ ╬æ╧ü╧ç╬╣╬║╬« ╬ú╬╡╬╗╬»╬┤╬▒
            </Link>
            <Link
              to="/app"
              data-testid="legal-launch-app-link"
              className="touch-target px-4 py-2 rounded-2xl bg-[#7A9A7B] text-white text-xs sm:text-sm font-extrabold hover:opacity-95"
            >
              ╬ò╬»╧â╬┐╬┤╬┐╧é ╧â╧ä╬╖╬╜ ╬ò╧å╬▒╧ü╬╝╬┐╬│╬« ΓåÆ
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Banner */}
        <section className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7A9A7B]/20 text-xs font-extrabold text-[#2C3539]">
            <span aria-hidden="true">≡ƒ¢í∩╕Å</span>
            <span>100% ╬ú╧à╬╝╬╝╧î╧ü╧å╧ë╧â╬╖ ╬╝╬╡ ╧ä╬┐╬╜ ╬ô╬╡╬╜╬╣╬║╧î ╬Ü╬▒╬╜╬┐╬╜╬╣╧â╬╝╧î ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒╧é ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ (╬ò╬ò 2016/679 &amp; ╬¥. 4624/2019)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2C3539] tracking-tight">
            ╬î╧ü╬┐╬╣ ╬º╧ü╬«╧â╬╖╧é ╬Ö╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒╧é, ╬á╬┐╬╗╬╣╧ä╬╣╬║╬« ╬æ╧Ç╬┐╧ü╧ü╬«╧ä╬┐╧à &amp; ╬á╬╗╬«╧ü╬╖╧é ╬ú╧à╬╝╬╝╧î╧ü╧å╧ë╧â╬╖ GDPR
          </h1>
          <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
            ╬ù ╬┤╬╣╬▒╬┤╬╣╬║╧ä╧à╬▒╬║╬« ╬╡╧å╬▒╧ü╬╝╬┐╬│╬« <strong>SynapsePlay (FocusEngine 5+)</strong> ╬▒╬╜╬▒╧Ç╧ä╧ì╧ç╬╕╬╖╬║╬╡ ╬║╬▒╬╣
            ╬▒╬╜╬▒╧Ç╧ä╧ì╧â╧â╬╡╧ä╬▒╬╣ ╬▒╧Ç╧î ╧ä╬╖╬╜{' '}
            <a
              href="https://digiads.gr"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="legal-digiads-header-link"
              className="font-extrabold text-[#4A6B82] underline underline-offset-4 hover:text-[#2C3539]"
            >
              DIGIADS (https://digiads.gr)
            </a>{' '}
            ╬╝╬╡ ╬▒╧Ç╧î╬╗╧à╧ä╬╖ ╧Ç╧ü╬┐╧ä╬╡╧ü╬▒╬╣╧î╧ä╬╖╧ä╬▒ ╧ä╬╖╬╜ ╬▒╧â╧å╬¼╬╗╬╡╬╣╬▒ ╧ä╧ë╬╜ ╧Ç╬▒╬╣╬┤╬╣╧Ä╬╜, ╧ä╬╖╬╜ ╧Ç╧ü╬┐╧â╧ä╬▒╧â╬»╬▒ ╧ä╬╖╧é ╬╣╬┤╬╣╧ë╧ä╬╣╬║╧î╧ä╬╖╧ä╬▒╧é ╬▒╧Ç╧î
            ╧ä╬┐╬╜ ╧â╧ç╬╡╬┤╬╣╬▒╧â╬╝╧î (<strong>Privacy-by-Design &amp; Privacy-by-Default</strong>, ╬å╧ü╬╕╧ü╬┐ 25
            ╬ô╬Ü╬á╬ö) ╬║╬▒╬╣ ╧ä╬╖╬╜ ╧Ç╬╗╬«╧ü╬╖ ╬┤╬╣╬▒╧å╬¼╬╜╬╡╬╣╬▒ ╬▒╧Ç╬¡╬╜╬▒╬╜╧ä╬╣ ╧â╬╡ ╬│╬┐╬╜╬╡╬»╧é, ╬║╬╖╬┤╬╡╬╝╧î╬╜╬╡╧é ╬║╬▒╬╣ ╬╡╧Ç╬▒╬│╬│╬╡╬╗╬╝╬▒╧ä╬»╬╡╧é ╧à╬│╬╡╬»╬▒╧é.
          </p>
          <div className="text-xs font-bold text-[#4A6B82]">
            ╬ñ╬╡╬╗╬╡╧à╧ä╬▒╬»╬▒ ╬ò╬╜╬╖╬╝╬¡╧ü╧ë╧â╬╖: ╬ƒ╬║╧ä╧Ä╬▓╧ü╬╣╬┐╧é 2026 ΓÇó ╬ê╬║╬┤╬┐╧â╬╖ ╬á╬┐╬╗╬╣╧ä╬╣╬║╬«╧é: 2.0 (EU/GR GDPR Compliant)
          </div>
        </section>

        {/* 1. Data Controller & Developer Identity */}
        <section
          aria-labelledby="legal-controller-heading"
          className="bg-[#FAF6EE] border-2 border-[#4A6B82]/40 rounded-3xl p-6 sm:p-8 space-y-4"
        >
          <h2 id="legal-controller-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            1. ╬ñ╬▒╧à╧ä╧î╧ä╬╖╧ä╬▒ ╬ö╬╖╬╝╬╣╬┐╧à╧ü╬│╬┐╧ì &amp; ╬Ñ╧Ç╬╡╧à╬╕╧ì╬╜╬┐╧à ╬ò╧Ç╬╡╬╛╬╡╧ü╬│╬▒╧â╬»╬▒╧é (Data Controller)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-1.5">
              <div className="font-extrabold text-[#4A6B82]">╬ª╬┐╧ü╬¡╬▒╧é ╬æ╬╜╬¼╧Ç╧ä╧à╬╛╬╖╧é &amp; ╬¢╬╡╬╣╧ä╬┐╧à╧ü╬│╬»╬▒╧é</div>
              <p className="font-bold text-[#2C3539]">
                DIGIADS ΓÇö ╬¿╬╖╧å╬╣╬▒╬║╬¡╧é ╬ò╧å╬▒╧ü╬╝╬┐╬│╬¡╧é &amp; ╬ñ╬╡╧ç╬╜╬┐╬╗╬┐╬│╬╣╬║╬¡╧é ╬¢╧ì╧â╬╡╬╣╧é
              </p>
              <p>
                ╬ò╧Ç╬»╧â╬╖╬╝╬╖ ╬Ö╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒:{' '}
                <a
                  href="https://digiads.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-[#4A6B82] underline"
                >
                  https://digiads.gr
                </a>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-1.5">
              <div className="font-extrabold text-[#4A6B82]">
                ╬ò╧Ç╬╣╬║╬┐╬╣╬╜╧ë╬╜╬»╬▒ ╬ÿ╬╡╬╝╬¼╧ä╧ë╬╜ ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒╧é ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ (GDPR)
              </div>
              <p className="text-[#2C3539]/90">
                ╬ô╬╣╬▒ ╬┐╧Ç╬┐╬╣╬┐╬┤╬«╧Ç╬┐╧ä╬╡ ╬▒╬»╧ä╬╖╬╝╬▒ ╧â╧ç╬╡╧ä╬╣╬║╬¼ ╬╝╬╡ ╧ä╬┐╧à╧é ╬î╧ü╬┐╧à╧é ╬º╧ü╬«╧â╬╖╧é, ╧ä╬╖╬╜ ╧Ç╧ü╬┐╧â╧ä╬▒╧â╬»╬▒ ╧Ç╧ü╬┐╧â╧ë╧Ç╬╣╬║╧Ä╬╜
                ╬┤╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ ╬« ╧ä╬╖╬╜ ╬¼╧â╬║╬╖╧â╬╖ ╧ä╧ë╬╜ ╬┤╬╣╬║╬▒╬╣╧ë╬╝╬¼╧ä╧ë╬╜ ╧â╬▒╧é ╬▓╬¼╧â╬╡╬╣ ╧ä╬┐╧à ╬ô╬Ü╬á╬ö, ╬╝╧Ç╬┐╧ü╬╡╬»╧ä╬╡ ╬╜╬▒
                ╬╡╧Ç╬╣╬║╬┐╬╣╬╜╧ë╬╜╬«╧â╬╡╧ä╬╡ ╬╝╬¡╧â╧ë ╧ä╬╖╧é ╬╡╧Ç╬»╧â╬╖╬╝╬╖╧é ╬╣╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒╧é{' '}
                <a
                  href="https://digiads.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-[#4A6B82] underline"
                >
                  digiads.gr
                </a>{' '}
                ╬« ╬╝╬¡╧â╧ë ╧ä╬╖╧é ╧å╧î╧ü╬╝╬▒╧é ╬▒╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖╧é ╧â╧ä╬┐ ╬á╬╡╧ü╬╣╬▓╬¼╬╗╬╗╬┐╬╜ ╬ô╬┐╬╜╬¡╬▒.
              </p>
            </div>
          </div>
        </section>

        {/* 2. GDPR Architecture & Children's Data Protection */}
        <section
          aria-labelledby="legal-gdpr-heading"
          className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <h2 id="legal-gdpr-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            2. ╬á╬┐╬╗╬╣╧ä╬╣╬║╬« ╬æ╧Ç╬┐╧ü╧ü╬«╧ä╬┐╧à &amp; ╬æ╧ü╧ç╬╣╧ä╬╡╬║╧ä╬┐╬╜╬╣╬║╬« ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒╧é ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ (GDPR)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                ≡ƒöÆ 2.1. 100% ╬ñ╬┐╧Ç╬╣╬║╬« ╬æ╧Ç╬┐╬╕╬«╬║╬╡╧à╧â╬╖ (╬å╧ü╬╕╧ü╬┐ 25 ╬ô╬Ü╬á╬ö ΓÇö Privacy-by-Design)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                ╬ñ╬┐ SynapsePlay ╬╗╬╡╬╣╧ä╬┐╧à╧ü╬│╬╡╬» ╬╝╬╡ ╬▒╧ü╧ç╬╣╧ä╬╡╬║╧ä╬┐╬╜╬╣╬║╬« <strong>Local-First / Client-Side</strong>.
                ╬ñ╬▒ ╬╝╬╣╬║╧ü╬¼ ╧Ç╧ü╬┐╧å╬»╬╗ ╧ä╧ë╬╜ ╧Ç╬▒╬╣╬┤╬╣╧Ä╬╜ (╧ê╬╡╧à╬┤╧Ä╬╜╧à╬╝╬┐, ╬╡╧Ç╬╣╬╗╬╡╬│╬╝╬¡╬╜╬┐ ╬╡╬╣╬║╬┐╬╜╬»╬┤╬╣╬┐ avatar, ╬╖╬╗╬╣╬║╬╣╬▒╬║╬« ╬┐╬╝╬¼╬┤╬▒
                ╬║╬▒╬╣ ╬╣╧â╧ä╬┐╧ü╬╣╬║╧î ╬┐╬╗╬┐╬║╬╗╬╖╧ü╧ë╬╝╬¡╬╜╧ë╬╜ ╬┤╧ü╬▒╧â╧ä╬╖╧ü╬╣╬┐╧ä╬«╧ä╧ë╬╜) ╬▒╧Ç╬┐╬╕╬╖╬║╬╡╧ì╬┐╬╜╧ä╬▒╬╣{' '}
                <strong>╬▒╧Ç╬┐╬║╬╗╬╡╬╣╧â╧ä╬╣╬║╬¼ ╧ä╬┐╧Ç╬╣╬║╬¼ ╧â╧ä╬╖ ╧â╧à╧â╬║╬╡╧à╬« ╧ä╬┐╧à ╧ç╧ü╬«╧â╧ä╬╖ (IndexedDB)</strong> ╬║╬▒╬╣{' '}
                <strong>╬┤╬╡╬╜ ╬╝╬╡╧ä╬▒╬┤╬»╬┤╬┐╬╜╧ä╬▒╬╣ ╬┐╧ì╧ä╬╡ ╬▒╧Ç╬┐╬╕╬╖╬║╬╡╧ì╬┐╬╜╧ä╬▒╬╣</strong> ╧â╬╡ ╬║╬╡╬╜╧ä╧ü╬╣╬║╬┐╧ì╧é servers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                ≡ƒæ╢ 2.2. ╬ò╬╣╬┤╬╣╬║╬« ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒ ╬æ╬╜╬╖╬╗╬»╬║╧ë╬╜ (╬å╧ü╬╕╧ü╬┐ 8 ╬ô╬Ü╬á╬ö &amp; ╬¥. 4624/2019)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                ╬ù ╬╡╧å╬▒╧ü╬╝╬┐╬│╬« ╬▒╧Ç╬╡╧à╬╕╧ì╬╜╬╡╧ä╬▒╬╣ ╧â╬╡ ╬│╬┐╬╜╬╡╬»╧é, ╬║╬╖╬┤╬╡╬╝╧î╬╜╬╡╧é ╬║╬▒╬╣ ╬╡╬╣╬┤╬╣╬║╬┐╧ì╧é ╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬¡╧é ╬│╬╣╬▒ ╧ç╧ü╬«╧â╬╖ ╬╝╬╡
                ╧Ç╬▒╬╣╬┤╬╣╬¼ 4ΓÇô12 ╬╡╧ä╧Ä╬╜. ╬ñ╬┐ ╬á╬╡╧ü╬╣╬▓╬¼╬╗╬╗╬┐╬╜ ╬ô╬┐╬╜╬¡╬▒/╬ò╬╣╬┤╬╣╬║╬┐╧ì ╧Ç╧ü╬┐╧â╧ä╬▒╧ä╬╡╧ì╬╡╧ä╬▒╬╣ ╬▒╧Ç╧î ╬┤╧à╬╜╬▒╬╝╬╣╬║╬« ╧Ç╧ì╬╗╬╖
                ╬╡╧Ç╬▒╬╗╬«╬╕╬╡╧à╧â╬╖╧é ╬╡╬╜╬╖╬╗╬»╬║╬┐╧à. ╬ù ╬╡╧å╬▒╧ü╬╝╬┐╬│╬« <strong>╬┤╬╡╬╜ ╬╢╬╖╧ä╬¼ ╬║╬▒╬╣ ╬┤╬╡╬╜ ╧â╧à╬╗╬╗╬¡╬│╬╡╬╣</strong>{' '}
                ╧Ç╧ü╬▒╬│╬╝╬▒╧ä╬╣╬║╬¼ ╬┐╬╜╬┐╬╝╬▒╧ä╬╡╧Ç╧Ä╬╜╧à╬╝╬▒ ╧Ç╬▒╬╣╬┤╬╣╧Ä╬╜, ╧å╧ë╧ä╬┐╬│╧ü╬▒╧å╬»╬╡╧é, ╬╖╧ç╬┐╬│╧ü╬▒╧å╬«╧â╬╡╬╣╧é ╧å╧ë╬╜╬«╧é, ╧â╧ä╬┐╬╣╧ç╬╡╬»╬▒
                ╧ä╬┐╧Ç╬┐╬╕╬╡╧â╬»╬▒╧é (GPS) ╬« ╬╡╧Ç╬▒╧å╬¡╧é.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                ≡ƒÆ│ 2.3. ╬æ╧â╧å╬¼╬╗╬╡╬╣╬▒ ╬ú╧à╬╜╬▒╬╗╬╗╬▒╬│╧Ä╬╜ &amp; ╬ú╧à╬╜╬┤╧ü╬┐╬╝╧Ä╬╜ (Stripe Checkout)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                ╬î╬╗╬╡╧é ╬┐╬╣ ╧Ç╬╗╬╖╧ü╧ë╬╝╬¡╧é ╧â╧à╬╜╬┤╧ü╬┐╬╝╧Ä╬╜ (╬ƒ╬╣╬║╬┐╬│╬╡╬╜╬╡╬╣╬▒╬║╧î ╬á╬╗╬¼╬╜╬┐, ╬ò╧Ç╬╣╧Ç╬╗╬¡╬┐╬╜ ╬á╧ü╬┐╧å╬»╬╗, Therapist Pro B2B)
                ╧Ç╧ü╬▒╬│╬╝╬▒╧ä╬┐╧Ç╬┐╬╣╬┐╧ì╬╜╧ä╬▒╬╣ ╬▒╧Ç╬┐╬║╬╗╬╡╬╣╧â╧ä╬╣╬║╬¼ ╧â╬╡ ╬╡╬╛╧ë╧ä╬╡╧ü╬╣╬║╬¡╧é, ╬║╧ü╧à╧Ç╧ä╬┐╬│╧ü╬▒╧å╬╖╬╝╬¡╬╜╬╡╧é ╧â╬╡╬╗╬»╬┤╬╡╧é ╧ä╬╖╧é{' '}
                <strong>Stripe (PCI-DSS Level 1 Certified)</strong>. ╬ù ╬╡╧å╬▒╧ü╬╝╬┐╬│╬« ╬┤╬╡╬╜ ╬╡╬╜╧â╧ë╬╝╬▒╧ä╧Ä╬╜╬╡╬╣ SDKs
                ╧Ç╬▒╧ü╬▒╬║╬┐╬╗╬┐╧ì╬╕╬╖╧â╬╖╧é ╧Ç╬╗╬╖╧ü╧ë╬╝╧Ä╬╜ ╬║╬▒╬╣ ╬╖ DIGIADS ╬┤╬╡╬╜ ╬¡╧ç╬╡╬╣ ╧Ç╬┐╧ä╬¡ ╧Ç╧ü╧î╧â╬▓╬▒╧â╬╖ ╧â╬╡ ╬▒╧ü╬╣╬╕╬╝╬┐╧ì╧é ╬║╬▒╧ü╧ä╧Ä╬╜.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                Γ£ë∩╕Å 2.4. ╬ò╬╕╬╡╬╗╬┐╬╜╧ä╬╣╬║╬« ╬Ñ╧Ç╬┐╬▓╬┐╬╗╬« ╬á╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╧ë╬╜ &amp; ╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖╧é (╬å╧ü╬╕╧ü╬┐ 6 ╧Ç╬▒╧ü. 1╬▒ ╬ô╬Ü╬á╬ö)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                ╬ú╧ä╬┐ ╧Ç╧ü╬┐╧â╧ä╬▒╧ä╬╡╧à╬╝╬¡╬╜╬┐ ╬á╬╡╧ü╬╣╬▓╬¼╬╗╬╗╬┐╬╜ ╬ô╬┐╬╜╬¡╬▒/╬ò╬╣╬┤╬╣╬║╬┐╧ì ╧Ç╬▒╧ü╬¡╧ç╬╡╧ä╬▒╬╣ ╧Ç╧ü╬┐╬▒╬╣╧ü╬╡╧ä╬╣╬║╬« ╧å╧î╧ü╬╝╬▒ ╬▒╧Ç╬┐╧â╧ä╬┐╬╗╬«╧é
                ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╧ë╬╜ ╬║╬▒╬╣ ╧Ç╧ü╬┐╧ä╬¼╧â╬╡╧ë╬╜ ╬▓╬╡╬╗╧ä╬»╧ë╧â╬╖╧é. ╬ù ╬▒╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬│╬»╬╜╬╡╧ä╬▒╬╣ ╬╝╧î╬╜╬┐ ╬║╬▒╧ä╧î╧Ç╬╣╬╜ ╧ü╬╖╧ä╬«╧é ╬╡╬╜╬¡╧ü╬│╬╡╬╣╬▒╧é
                ╧ä╬┐╧à ╬╡╬╜╬«╬╗╬╣╬║╬▒ ╧ç╧ü╬«╧â╧ä╬╖ ╬║╬▒╬╣ ╧ä╬▒ ╧â╧ä╬┐╬╣╧ç╬╡╬»╬▒ ╧ç╧ü╬╖╧â╬╣╬╝╬┐╧Ç╬┐╬╣╬┐╧ì╬╜╧ä╬▒╬╣ ╬▒╧Ç╬┐╬║╬╗╬╡╬╣╧â╧ä╬╣╬║╬¼ ╬│╬╣╬▒ ╧ä╬╖╬╜ ╧ä╬╡╧ç╬╜╬╣╬║╬« ╬║╬▒╬╣
                ╧Ç╬▒╬╣╬┤╬▒╬│╧ë╬│╬╣╬║╬« ╬▓╬╡╬╗╧ä╬»╧ë╧â╬╖ ╧ä╬╖╧é ╬╡╧å╬▒╧ü╬╝╬┐╬│╬«╧é.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Interactive GDPR Rights Center (Articles 15, 17, 20) */}
        <section
          aria-labelledby="legal-rights-heading"
          data-testid="gdpr-rights-action-center"
          className="bg-[#FAF6EE] border-2 border-[#D97757] rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <h2 id="legal-rights-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
              3. ╬ñ╬▒ ╬ö╬╣╬║╬▒╬╣╧Ä╬╝╬▒╧ä╬¼ ╧â╬▒╧é ╬▓╬¼╧â╬╡╬╣ ╧ä╬┐╧à GDPR (╬å╧ü╬╕╧ü╬▒ 15ΓÇô22 ╬ô╬Ü╬á╬ö) &amp; ╬å╬╝╬╡╧â╬╖ ╬å╧â╬║╬╖╧â╬╖
            </h2>
            <p className="text-sm text-[#2C3539]/85">
              ╬ú╧ì╬╝╧å╧ë╬╜╬▒ ╬╝╬╡ ╧ä╬┐╬╜ ╬ô╬╡╬╜╬╣╬║╧î ╬Ü╬▒╬╜╬┐╬╜╬╣╧â╬╝╧î ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒╧é ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ (╬ò╬ò 2016/679), ╬¡╧ç╬╡╧ä╬╡ ╬┤╬╣╬║╬▒╬»╧ë╬╝╬▒
              ╧Ç╧ü╧î╧â╬▓╬▒╧â╬╖╧é (╬å╧ü╬╕╧ü╬┐ 15), ╬┤╬╣╧î╧ü╬╕╧ë╧â╬╖╧é (╬å╧ü╬╕╧ü╬┐ 16), ╬┤╬╣╬▒╬│╧ü╬▒╧å╬«╧é / ┬½╬┤╬╣╬║╬▒╬»╧ë╬╝╬▒ ╧â╧ä╬╖ ╬╗╬«╬╕╬╖┬╗ (╬å╧ü╬╕╧ü╬┐ 17),
              ╧Ç╬╡╧ü╬╣╬┐╧ü╬╣╧â╬╝╬┐╧ì ╬╡╧Ç╬╡╬╛╬╡╧ü╬│╬▒╧â╬»╬▒╧é (╬å╧ü╬╕╧ü╬┐ 18) ╬║╬▒╬╣ ╧å╬┐╧ü╬╖╧ä╧î╧ä╬╖╧ä╬▒╧é ╧ä╧ë╬╜ ╬┤╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ ╧â╬▒╧é (╬å╧ü╬╕╧ü╬┐ 20), ╬║╬▒╬╕╧Ä╧é
              ╬║╬▒╬╣ ╬┤╬╣╬║╬▒╬»╧ë╬╝╬▒ ╧à╧Ç╬┐╬▓╬┐╬╗╬«╧é ╬▒╬╜╬▒╧å╬┐╧ü╬¼╧é ╧â╧ä╬╖╬╜ ╬æ╧ü╧ç╬« ╬á╧ü╬┐╧â╧ä╬▒╧â╬»╬▒╧é ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ ╬á╧ü╬┐╧â╧ë╧Ç╬╣╬║╬┐╧ì ╬º╬▒╧ü╬▒╬║╧ä╬«╧ü╬▒ (
              <a
                href="https://www.dpa.gr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#4A6B82] underline"
              >
                www.dpa.gr
              </a>
              ). ╬ò╧Ç╬╡╬╣╬┤╬« ╧ä╬▒ ╬┤╬╡╬┤╬┐╬╝╬¡╬╜╬▒ ╧ä╬╖╧ü╬┐╧ì╬╜╧ä╬▒╬╣ ╧ä╬┐╧Ç╬╣╬║╬¼ ╧â╧ä╬╖ ╧â╧à╧â╬║╬╡╧à╬« ╧â╬▒╧é, ╬╝╧Ç╬┐╧ü╬╡╬»╧ä╬╡ ╬╜╬▒ ╬▒╧â╬║╬«╧â╬╡╧ä╬╡ ╧ä╬▒
              ╬┤╬╣╬║╬▒╬╣╧Ä╬╝╬▒╧ä╬▒ ╬ª╬┐╧ü╬╖╧ä╧î╧ä╬╖╧ä╬▒╧é ╬║╬▒╬╣ ╬ƒ╧ü╬╣╧â╧ä╬╣╬║╬«╧é ╬ö╬╣╬▒╬│╧ü╬▒╧å╬«╧é ╬▒╬║╬▒╧ü╬╣╬▒╬»╬▒ ╧Ç╬▒╧ü╬▒╬║╬¼╧ä╧ë:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="gdpr-export-data-btn"
              onClick={handleExportGdprPortabilityJson}
              className="touch-target px-5 py-3 rounded-2xl bg-[#4A6B82] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95"
            >
              <span aria-hidden="true">≡ƒôÑ</span>
              <span>╬ò╬╛╬▒╬│╧ë╬│╬« ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ ╬ú╧à╧â╬║╬╡╧à╬«╧é ╧â╬╡ JSON (╬å╧ü╬╕╧ü╬┐ 20 ╬ô╬Ü╬á╬ö)</span>
            </button>

            <button
              type="button"
              data-testid="gdpr-erase-all-data-btn"
              onClick={() => void handleGdprRightToErasure()}
              className="touch-target px-5 py-3 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95"
            >
              <span aria-hidden="true">≡ƒùæ∩╕Å</span>
              <span>╬ƒ╧ü╬╣╧â╧ä╬╣╬║╬« ╬ö╬╣╬▒╬│╧ü╬▒╧å╬« ╬î╬╗╧ë╬╜ ╧ä╧ë╬╜ ╬ñ╬┐╧Ç╬╣╬║╧Ä╬╜ ╬ö╬╡╬┤╬┐╬╝╬¡╬╜╧ë╬╜ (╬å╧ü╬╕╧ü╬┐ 17 ╬ô╬Ü╬á╬ö)</span>
            </button>
          </div>

          {wipeConfirmedMessage && (
            <div
              role="status"
              data-testid="gdpr-erase-confirmation"
              className="p-4 rounded-2xl bg-[#7A9A7B]/20 border-2 border-[#7A9A7B] text-xs sm:text-sm font-extrabold text-[#2C3539]"
            >
              Γ£ö {wipeConfirmedMessage}
            </div>
          )}
        </section>

        {/* 4. Terms of Use & Intellectual Property */}
        <section
          aria-labelledby="legal-terms-heading"
          className="bg-[#FAF6EE] border-2 border-[#2C3539]/20 rounded-3xl p-6 sm:p-8 space-y-4 text-sm leading-relaxed"
        >
          <h2 id="legal-terms-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            4. ╬î╧ü╬┐╬╣ ╬º╧ü╬«╧â╬╖╧é ╬Ö╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒╧é &amp; ╬å╬┤╬╡╬╣╬▒ ╬º╧ü╬«╧â╬╖╧é ╬ò╧å╬▒╧ü╬╝╬┐╬│╬«╧é (Terms of Service)
          </h2>

          <div className="space-y-3 text-[#2C3539]/90">
            <p>
              <strong>4.1. ╬æ╧Ç╬┐╬┤╬┐╧ç╬« ╬î╧ü╧ë╬╜:</strong> ╬ù ╧Ç╬╗╬┐╬«╬│╬╖╧â╬╖ ╬║╬▒╬╣ ╧ç╧ü╬«╧â╬╖ ╧ä╬╖╧é ╬╣╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒╧é ╬║╬▒╬╣ ╧ä╬╖╧é
              ╬╡╧å╬▒╧ü╬╝╬┐╬│╬«╧é SynapsePlay ╧â╧à╬╜╬╡╧Ç╬¼╬│╬╡╧ä╬▒╬╣ ╧ä╬╖╬╜ ╬▒╬╜╬╡╧Ç╬╣╧å╧ì╬╗╬▒╬║╧ä╬╖ ╬▒╧Ç╬┐╬┤╬┐╧ç╬« ╧ä╧ë╬╜ ╧Ç╬▒╧ü╧î╬╜╧ä╧ë╬╜ ╬î╧ü╧ë╬╜ ╬º╧ü╬«╧â╬╖╧é ╬▒╧Ç╧î
              ╧ä╬┐╬╜ ╬╡╬╜╬«╬╗╬╣╬║╬▒ ╧ç╧ü╬«╧â╧ä╬╖ (╬│╬┐╬╜╬¡╬▒, ╬║╬╖╬┤╬╡╬╝╧î╬╜╬▒ ╬« ╬╡╧Ç╬▒╬│╬│╬╡╬╗╬╝╬▒╧ä╬»╬▒ ╬╡╬╣╬┤╬╣╬║╬«╧é ╬▒╬│╧ë╬│╬«╧é/╧à╬│╬╡╬»╬▒╧é).
            </p>
            <p>
              <strong>4.2. ╬ö╬╣╬║╬▒╬╣╧Ä╬╝╬▒╧ä╬▒ ╬á╬╜╬╡╧à╬╝╬▒╧ä╬╣╬║╬«╧é ╬Ö╬┤╬╣╬┐╬║╧ä╬╖╧â╬»╬▒╧é:</strong> ╬ñ╬┐ ╧â╧ì╬╜╬┐╬╗╬┐ ╧ä╬┐╧à ╧Ç╬╡╧ü╬╣╬╡╧ç╬┐╬╝╬¡╬╜╬┐╧à,
              ╬┐ ╧Ç╬╖╬│╬▒╬»╬┐╧é ╬║╧Ä╬┤╬╣╬║╬▒╧é, ╬╖ ╬▒╧ü╧ç╬╣╧ä╬╡╬║╧ä╬┐╬╜╬╣╬║╬« FocusEngine 5+, ╬╖ ╬╝╬╖╧ç╬▒╬╜╬« ╧å╧ë╬╜╬╖╧ä╬╣╬║╬«╧é ╬║╬▒╬╕╬┐╬┤╬«╬│╬╖╧â╬╖╧é, ╧ä╬▒
              ╧â╬╡╬╜╬¼╧ü╬╣╬▒ ╬┤╧ü╬▒╧â╧ä╬╖╧ü╬╣╬┐╧ä╬«╧ä╧ë╬╜, ╧ä╬▒ ╬│╧ü╬▒╧å╬╣╬║╬¼ ╬║╬▒╬╣ ╧ä╬▒ ╬╡╬╝╧Ç╬┐╧ü╬╣╬║╬¼ ╧â╬«╬╝╬▒╧ä╬▒ ╧ä╬┐╧à SynapsePlay ╬▒╧Ç╬┐╧ä╬╡╬╗╬┐╧ì╬╜
              ╧Ç╬╜╬╡╧à╬╝╬▒╧ä╬╣╬║╬« ╬╣╬┤╬╣╬┐╬║╧ä╬╖╧â╬»╬▒ ╧ä╬╖╧é{' '}
              <a
                href="https://digiads.gr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#4A6B82] underline"
              >
                DIGIADS (https://digiads.gr)
              </a>{' '}
              ╬║╬▒╬╣ ╧Ç╧ü╬┐╧â╧ä╬▒╧ä╬╡╧ì╬┐╬╜╧ä╬▒╬╣ ╬▒╧Ç╧î ╧ä╬╖╬╜ ╬╡╬╗╬╗╬╖╬╜╬╣╬║╬« ╬║╬▒╬╣ ╬╡╧à╧ü╧ë╧Ç╬▒╧è╬║╬« ╬╜╬┐╬╝╬┐╬╕╬╡╧â╬»╬▒ ╧Ç╬╡╧ü╬» ╧Ç╬╜╬╡╧à╬╝╬▒╧ä╬╣╬║╬«╧é
              ╬╣╬┤╬╣╬┐╬║╧ä╬╖╧â╬»╬▒╧é (╬¥. 2121/1993). ╬æ╧Ç╬▒╬│╬┐╧ü╬╡╧ì╬╡╧ä╬▒╬╣ ╬╖ ╬▒╬╜╬▒╧Ç╬▒╧ü╬▒╬│╧ë╬│╬«, ╬▒╬╜╧ä╬╣╬│╧ü╬▒╧å╬«, ╬▒╧Ç╬┐╧â╧à╬╝╧Ç╬»╬╗╬╖╧â╬╖ ╬«
              ╬╡╬╝╧Ç╬┐╧ü╬╣╬║╬« ╬╡╬║╬╝╬╡╧ä╬¼╬╗╬╗╬╡╧à╧â╬╖ ╧ç╧ë╧ü╬»╧é ╬¡╬│╬│╧ü╬▒╧å╬╖ ╬¼╬┤╬╡╬╣╬▒.
            </p>
            <p>
              <strong>4.3. ╬ò╧Ç╬»╧Ç╬╡╬┤╬▒ ╬æ╬┤╬╡╬╣╬┐╬┤╧î╧ä╬╖╧â╬╖╧é (╬ƒ╬╣╬║╬┐╬│╬╡╬╜╬╡╬╣╬▒╬║╧î &amp; ╬ò╧Ç╬▒╬│╬│╬╡╬╗╬╝╬▒╧ä╬╣╬║╧î B2B):</strong> ╬ñ╬┐
              ╬ƒ╬╣╬║╬┐╬│╬╡╬╜╬╡╬╣╬▒╬║╧î ╬á╬╗╬¼╬╜╬┐ ╧Ç╧ü╬┐╬┐╧ü╬»╬╢╬╡╧ä╬▒╬╣ ╬▒╧Ç╬┐╬║╬╗╬╡╬╣╧â╧ä╬╣╬║╬¼ ╬│╬╣╬▒ ╬╣╬┤╬╣╧ë╧ä╬╣╬║╬« ╬┐╬╣╬║╬╣╬▒╬║╬« ╧ç╧ü╬«╧â╬╖ (╬¡╧ë╧é 2 ╧Ç╧ü╬┐╧å╬»╬╗
              ╧Ç╬▒╬╣╬┤╬╣╧Ä╬╜ ╬▒╬╜╬¼ ╧â╧à╧â╬║╬╡╧à╬«, ╬╝╬╡ ╬┤╧à╬╜╬▒╧ä╧î╧ä╬╖╧ä╬▒ ╧Ç╧ü╬┐╧â╬╕╬«╬║╬╖╧é ╬╡╧Ç╬╣╧Ç╬╗╬¡╬┐╬╜ ╧Ç╧ü╬┐╧å╬»╬╗). ╬ù ╧ç╧ü╬«╧â╬╖ ╧â╬╡ ╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬«╧ü╬╣╬▒,
              ╬║╬¡╬╜╧ä╧ü╬▒ ╬╡╬╣╬┤╬╣╬║╧Ä╬╜ ╬╕╬╡╧ü╬▒╧Ç╬╡╬╣╧Ä╬╜, ╧â╧ç╬┐╬╗╬╡╬»╬▒ ╬« ╬║╬╗╬╣╬╜╬╣╬║╬¡╧é ╧â╧à╬╜╬╡╬┤╧ü╬»╬╡╧é ╬▒╧Ç╬▒╬╣╧ä╬╡╬» ╧ä╬╖╬╜ ╬╡╧Ç╬▒╬│╬│╬╡╬╗╬╝╬▒╧ä╬╣╬║╬« ╬¼╬┤╬╡╬╣╬▒{' '}
              <strong>SynapsePlay Therapist Pro (╬ò╧ä╬«╧â╬╣╬┐ B2B)</strong>.
            </p>
            <p>
              <strong>4.4. ╬ò╧å╬▒╧ü╬╝╬┐╧â╧ä╬¡╬┐ ╬ö╬»╬║╬▒╬╣╬┐:</strong> ╬ƒ╬╣ ╧Ç╬▒╧ü╧î╬╜╧ä╬╡╧é ╬î╧ü╬┐╬╣ ╬º╧ü╬«╧â╬╖╧é ╬┤╬╣╬¡╧Ç╬┐╬╜╧ä╬▒╬╣ ╬▒╧Ç╧î ╧ä╬┐
              ╬ò╬╗╬╗╬╖╬╜╬╣╬║╧î ╬║╬▒╬╣ ╧ä╬┐ ╬ò╧à╧ü╧ë╧Ç╬▒╧è╬║╧î ╬ö╬»╬║╬▒╬╣╬┐.
            </p>
          </div>
        </section>

        {/* 5. Medical & Pedagogical Disclaimer + 6. Cookies & Local Storage Table */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAF6EE] border-2 border-[#4A6B82]/40 rounded-3xl p-6 space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C3539]">
              5. ╬Ö╬▒╧ä╧ü╬╣╬║╬« &amp; ╬á╬▒╬╣╬┤╬▒╬│╧ë╬│╬╣╬║╬« ╬æ╧Ç╬┐╧Ç╬┐╬»╬╖╧â╬╖ ╬ò╧à╬╕╧ì╬╜╬╖╧é
            </h2>
            <p className="text-[#2C3539]/90">
              ╬ñ╬┐ <strong>SynapsePlay (FocusEngine 5+)</strong> ╬╡╬»╬╜╬▒╬╣ ╧Ç╬▒╬╣╬┤╬▒╬│╧ë╬│╬╣╬║╧î ╬║╬▒╬╣ ╧à╧Ç╬┐╧â╧ä╬╖╧ü╬╣╬║╧ä╬╣╬║╧î
              ╧ê╬╖╧å╬╣╬▒╬║╧î ╬╡╧ü╬│╬▒╬╗╬╡╬»╬┐ ╬╡╬╛╬¼╧â╬║╬╖╧â╬╖╧é ╬╡╬║╧ä╬╡╬╗╬╡╧â╧ä╬╣╬║╧Ä╬╜ ╬╗╬╡╬╣╧ä╬┐╧à╧ü╬│╬╣╧Ä╬╜, ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬╖╧ä╬╣╬║╧î╧ä╬╖╧ä╬▒╧é ╬║╬▒╬╣
              ╬▒╧à╧ä╬┐╧ü╧ü╧ì╬╕╬╝╬╣╧â╬╖╧é. <strong>╬ö╬╡╬╜ ╬▒╧Ç╬┐╧ä╬╡╬╗╬╡╬» ╬╣╬▒╧ä╧ü╬╣╬║╬« ╧â╧à╧â╬║╬╡╧à╬« (Medical Device)</strong>, ╬┤╬╡╬╜
              ╧Ç╧ü╬▒╬│╬╝╬▒╧ä╬┐╧Ç╬┐╬╣╬╡╬» ╬║╬╗╬╣╬╜╬╣╬║╬« ╬┤╬╣╬¼╬│╬╜╧ë╧â╬╖ ╬ö╬ò╬á╬Ñ ╬« ╬¼╬╗╬╗╧ë╬╜ ╬▒╬╜╬▒╧Ç╧ä╧à╬╛╬╣╬▒╬║╧Ä╬╜ ╬┤╬╣╬▒╧ä╬▒╧ü╬▒╧ç╧Ä╬╜ ╬║╬▒╬╣{' '}
              <strong>╬┤╬╡╬╜ ╧à╧Ç╬┐╬║╬▒╬╕╬╣╧â╧ä╬¼</strong> ╧ä╬╖╬╜ ╬╡╬╛╬▒╧ä╬┐╬╝╬╣╬║╬╡╧à╬╝╬¡╬╜╬╖ ╬╣╬▒╧ä╧ü╬╣╬║╬«, ╧Ç╬▒╬╣╬┤╬┐╧ê╧à╧ç╬╣╬▒╧ä╧ü╬╣╬║╬«,
              ╧ê╧à╧ç╬┐╬╗╬┐╬│╬╣╬║╬«, ╬╗╬┐╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬╣╬║╬« ╬« ╬╡╧ü╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬╣╬║╬« ╬▒╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖ ╬║╬▒╬╣ ╧Ç╬▒╧ü╬¡╬╝╬▓╬▒╧â╬╖.
            </p>
          </div>

          <div className="bg-[#FAF6EE] border-2 border-[#7A9A7B]/50 rounded-3xl p-6 space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C3539]">
              6. ╬á╬┐╬╗╬╣╧ä╬╣╬║╬« Cookies &amp; ╬ñ╬┐╧Ç╬╣╬║╬«╧é ╬æ╧Ç╬┐╬╕╬«╬║╬╡╧à╧â╬╖╧é (ePrivacy)
            </h2>
            <p className="text-[#2C3539]/90">
              ╬ù ╬╣╧â╧ä╬┐╧â╬╡╬╗╬»╬┤╬▒ <strong>╬┤╬╡╬╜ ╧ç╧ü╬╖╧â╬╣╬╝╬┐╧Ç╬┐╬╣╬╡╬»</strong> ╬┤╬╣╬▒╧å╬╖╬╝╬╣╧â╧ä╬╣╬║╬¼ cookies, cookies
              ╧Ç╧ü╬┐╧å╬»╬╗ ╬« ╬╡╧ü╬│╬▒╬╗╬╡╬»╬▒ ╧Ç╬▒╧ü╬▒╬║╬┐╬╗╬┐╧ì╬╕╬╖╧â╬╖╧é ╧ä╧ü╬»╧ä╧ë╬╜ (Zero Third-Party Tracking). ╬º╧ü╬╖╧â╬╣╬╝╬┐╧Ç╬┐╬╣╬╡╬»
              ╬▒╧Ç╬┐╬║╬╗╬╡╬╣╧â╧ä╬╣╬║╬¼ ╧ä╬╡╧ç╬╜╬╣╬║╬¼ ╬▒╧Ç╬▒╧ü╬▒╬»╧ä╬╖╧ä╬╖ ╧ä╬┐╧Ç╬╣╬║╬« ╬▒╧Ç╬┐╬╕╬«╬║╬╡╧à╧â╬╖ ╧â╧ä╬┐╬╜ browser ╧â╬▒╧é:
            </p>
            <ul className="text-xs font-bold space-y-1.5 text-[#2C3539]">
              <li>
                ΓÇó <code>IndexedDB (synapseplay_db)</code>: ╬ñ╬┐╧Ç╬╣╬║╬« ╬▒╧Ç╬┐╬╕╬«╬║╬╡╧à╧â╬╖ ╧Ç╧ü╬┐╧å╬»╬╗, ╧ü╧à╬╕╬╝╬»╧â╬╡╧ë╬╜ &amp;
                ╬╣╧â╧ä╬┐╧ü╬╣╬║╬┐╧ì ╧â╧ä╬╖ ╧â╧à╧â╬║╬╡╧à╬«.
              </li>
              <li>
                ΓÇó <code>localStorage (synapseplay_gdpr_consent_v1)</code>: ╬æ╧Ç╬┐╬╝╬╜╬╖╬╝╧î╬╜╬╡╧à╧â╬╖ ╬╡╬╜╬╖╬╝╬¡╧ü╧ë╧â╬╖╧é
                ╧ä╬┐╧à ╬╝╬╖╬╜╧ì╬╝╬▒╧ä╬┐╧é GDPR.
              </li>
            </ul>
          </div>
        </section>

        {/* Official Social Media & Developer Contact Bar */}
        <footer className="bg-[#FAF6EE] border-2 border-[#2C3539]/15 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-[#2C3539]">
          <div>
            ┬⌐ SynapsePlay ΓÇö ╬æ╬╜╬¼╧Ç╧ä╧à╬╛╬╖:{' '}
            <a
              href="https://digiads.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-[#4A6B82] underline"
            >
              DIGIADS (https://digiads.gr)
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={SOCIAL_LINKS.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="legal-social-facebook"
              className="touch-target px-3.5 py-2 rounded-xl bg-[#EFE8D8] border border-[#2C3539]/20 font-extrabold text-[#2C3539] hover:bg-[#4A6B82] hover:text-white transition-colors"
            >
              Facebook: Synapseplay.gr Γåù∩╕Å
            </a>
            <a
              href={SOCIAL_LINKS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="legal-social-instagram"
              className="touch-target px-3.5 py-2 rounded-xl bg-[#EFE8D8] border border-[#2C3539]/20 font-extrabold text-[#2C3539] hover:bg-[#D97757] hover:text-white transition-colors"
            >
              Instagram: {SOCIAL_LINKS.instagramHandle} Γåù∩╕Å
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LegalCompliancePage;
