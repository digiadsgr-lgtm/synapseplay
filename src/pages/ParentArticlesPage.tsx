import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ADHD_PARENT_AND_B2B_ARTICLES, type AdhdArticlePost } from '../data/adhdParentArticles';
import { SynapsePlayLogoMark } from '../components/SynapsePlayLogoMark';

export const ParentArticlesPage: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'FACEBOOK' | 'LINKEDIN'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredArticles = ADHD_PARENT_AND_B2B_ARTICLES.filter((art) => {
    if (selectedChannel === 'FACEBOOK') {
      return art.channel === 'Facebook (Γονείς & Οικογένεια)';
    }
    if (selectedChannel === 'LINKEDIN') {
      return art.channel === 'LinkedIn (Θεραπευτές, Κέντρα & Επενδυτές)';
    }
    return true;
  });

  const formatPostWithHashtags = (art: AdhdArticlePost): string => {
    return `${art.titleEl}\n\n${art.fullSocialPostEl}\n\n${art.hashtags.join(' ')}`;
  };

  const handleCopyPost = async (art: AdhdArticlePost) => {
    const text = formatPostWithHashtags(art);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // fallback ignored
    }
    setCopiedId(art.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === art.id ? null : prev));
    }, 2500);
  };

  const handleDownloadCsvForScheduler = () => {
    const headers = ['Number', 'Channel', 'Title', 'Full_Post_Text', 'Image_Path'];
    const rows = ADHD_PARENT_AND_B2B_ARTICLES.map((art) => {
      const fullText = formatPostWithHashtags(art).replace(/"/g, '""');
      const title = art.titleEl.replace(/"/g, '""');
      return `"${art.number}","${art.channel}","${title}","${fullText}","${art.imageUrl}"`;
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synapseplay-12-social-posts-facebook-linkedin.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="parent-articles-page"
      className="min-h-screen bg-[#EFE8D8] text-[#2C3539] font-sans pb-16"
    >
      {/* Top Navigation */}
      <header className="border-b border-[#2C3539]/15 bg-[#FAF6EE] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <SynapsePlayLogoMark sizeClassName="w-11 h-11" />
            <div>
              <span className="text-lg font-extrabold text-[#2C3539]">SynapsePlay</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#7A9A7B]/20 text-[#2C3539] text-xs font-extrabold">
                Άρθρα ΔΕΠΥ &amp; Social Media Hub
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              data-testid="articles-back-home-link"
              className="touch-target px-4 py-2 rounded-2xl bg-white border border-[#2C3539]/20 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-[#EFE8D8]"
            >
              ← Αρχική Παρουσίαση
            </Link>
            <Link
              to="/app"
              data-testid="articles-launch-app-link"
              className="touch-target px-5 py-2.5 rounded-2xl bg-[#D97757] text-white text-xs sm:text-sm font-extrabold hover:opacity-95"
            >
              Είσοδος στην Εφαρμογή →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero & Fast Publishing Guide for Facebook & LinkedIn */}
        <section className="bg-[#1B2225] text-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7A9A7B]/30 border border-[#7A9A7B] text-xs font-extrabold text-[#EFE8D8]">
                🚀 Έτοιμο Περιεχόμενο Δημοσίευσης (Facebook Γονέων &amp; LinkedIn Θεραπευτών/Επενδυτών)
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#FAF6EE]">
                12 Έτοιμα Άρθρα &amp; Συμβουλές ΔΕΠΥ (Κείμενα + Κάρτες 1080×1080 + Μαύρα Εξώφυλλα)
              </h1>
              <p className="text-sm sm:text-base text-[#EFE8D8]/85 leading-relaxed">
                Κάθε άρθρο είναι γραμμένο σε απλή, ζεστή γλώσσα χωρίς δυσνόητους ιατρικούς όρους:
                ξεκινά από μια καθημερινή δυσκολία που ζει κάθε γονέας, δίνει 3 άμεσες πρακτικές
                συμβουλές (βασισμένες στα πρωτόκολλά μας) και οδηγεί φυσικά στη δωρεάν δοκιμή του{' '}
                <strong>SynapsePlay</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="download-all-posts-csv-btn"
                onClick={handleDownloadCsvForScheduler}
                className="touch-target px-5 py-3 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95"
              >
                <span aria-hidden="true">📥</span>
                <span>Λήψη Όλων σε CSV (Meta Suite / Buffer)</span>
              </button>
              <a
                href="/brand-kit/png/synapseplay-facebook-cover-dark-1640x624.png"
                download="synapseplay-facebook-cover-dark-1640x624.png"
                data-testid="download-fb-dark-cover-btn"
                className="touch-target px-5 py-2.5 rounded-2xl bg-[#252F33] border border-[#7A9A7B] text-[#FAF6EE] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#7A9A7B] hover:text-white transition-colors"
              >
                <span>⬛ Λήψη Μαύρου Εξωφύλλου Facebook (1640×624)</span>
              </a>
              <a
                href="/brand-kit/png/synapseplay-linkedin-cover-dark-1584x396.png"
                download="synapseplay-linkedin-cover-dark-1584x396.png"
                data-testid="download-li-dark-cover-btn"
                className="touch-target px-5 py-2.5 rounded-2xl bg-[#252F33] border border-[#4A6B82] text-[#FAF6EE] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#4A6B82] hover:text-white transition-colors"
              >
                <span>⬛ Λήψη Μαύρου Εξωφύλλου LinkedIn (1584×396)</span>
              </a>
            </div>
          </div>

          {/* 3-Step Workflow to Publish All 12 Articles Today */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-[#252F33] border border-white/10 space-y-1">
              <div className="font-extrabold text-[#96B897]">
                Βήμα 1: Εξώφυλλα Facebook &amp; LinkedIn (1 λεπτό)
              </div>
              <p className="text-[#EFE8D8]/85">
                Κατεβάστε τα 2 μαύρα οριζόντια εξώφυλλα από τα κουμπιά δεξιά και ανεβάστε τα στη
                Σελίδα Facebook (προς Γονείς) και στη Σελίδα/Προφίλ LinkedIn (προς Θεραπευτές &amp;
                Επενδυτές).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#252F33] border border-white/10 space-y-1">
              <div className="font-extrabold text-[#96B897]">
                Βήμα 2: Αντιγραφή με 1 Κλικ + Εικόνα (5 λεπτά)
              </div>
              <p className="text-[#EFE8D8]/85">
                Σε κάθε άρθρο παρακάτω πατήστε <strong>«📋 Αντιγραφή Δημοσίευσης»</strong> και{' '}
                <strong>«🖼️ Λήψη Εικόνας (1080×1080)»</strong>.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#252F33] border border-white/10 space-y-1">
              <div className="font-extrabold text-[#96B897]">
                Βήμα 3: Μαζική Ανάρτηση στο Meta Business Suite
              </div>
              <p className="text-[#EFE8D8]/85">
                Ανοίξτε το δωρεάν <code>business.facebook.com</code> (Planner) και το LinkedIn
                Schedule: μπορείτε να ανεβάσετε τα πρώτα 3 σήμερα και να προγραμματίσετε τα υπόλοιπα
                9 αυτόματα!
              </p>
            </div>
          </div>
        </section>

        {/* Channel Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="filter-articles-all"
              onClick={() => setSelectedChannel('ALL')}
              className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                selectedChannel === 'ALL'
                  ? 'bg-[#2C3539] text-white border-[#2C3539]'
                  : 'bg-[#FAF6EE] text-[#2C3539] border-[#2C3539]/20'
              }`}
            >
              Όλα τα Άρθρα ({ADHD_PARENT_AND_B2B_ARTICLES.length})
            </button>
            <button
              type="button"
              data-testid="filter-articles-facebook"
              onClick={() => setSelectedChannel('FACEBOOK')}
              className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                selectedChannel === 'FACEBOOK'
                  ? 'bg-[#7A9A7B] text-white border-[#7A9A7B]'
                  : 'bg-[#FAF6EE] text-[#2C3539] border-[#7A9A7B]'
              }`}
            >
              📘 Facebook — Για Γονείς &amp; ΔΕΠΥ (10)
            </button>
            <button
              type="button"
              data-testid="filter-articles-linkedin"
              onClick={() => setSelectedChannel('LINKEDIN')}
              className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                selectedChannel === 'LINKEDIN'
                  ? 'bg-[#4A6B82] text-white border-[#4A6B82]'
                  : 'bg-[#FAF6EE] text-[#2C3539] border-[#4A6B82]'
              }`}
            >
              💼 LinkedIn — Για Θεραπευτές, Κέντρα &amp; Επενδυτές (2)
            </button>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {filteredArticles.map((art) => {
            const isCopied = copiedId === art.id;
            return (
              <article
                key={art.id}
                data-testid={`social-article-card-${art.number}`}
                className="bg-[#FAF6EE] border-2 border-[#7A9A7B]/60 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Left Column: 1080x1080 Dark Visual Card Preview & Actions */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="rounded-2xl overflow-hidden border-2 border-[#2C3539]/20 shadow-sm bg-[#14191C]">
                    <img
                      src={art.imageUrl}
                      alt={art.titleEl}
                      className="w-full h-auto block"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      data-testid={`copy-article-btn-${art.number}`}
                      onClick={() => void handleCopyPost(art)}
                      className={`touch-target w-full px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                        isCopied
                          ? 'bg-[#5B7B5C] text-white'
                          : 'bg-[#2C3539] text-white hover:bg-[#4A6B82]'
                      }`}
                    >
                      <span aria-hidden="true">{isCopied ? '✔' : '📋'}</span>
                      <span>
                        {isCopied
                          ? 'Αντιγράφηκε στο Πρόχειρο!'
                          : 'Αντιγραφή Κειμένου Δημοσίευσης'}
                      </span>
                    </button>

                    <a
                      href={art.imageUrl}
                      download={`synapseplay-post-${art.number}.png`}
                      data-testid={`download-article-img-${art.number}`}
                      className="touch-target w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#2C3539]/25 text-[#2C3539] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#EFE8D8]"
                    >
                      <span aria-hidden="true">🖼️</span>
                      <span>Λήψη Εικόνας Post (1080×1080 PNG)</span>
                    </a>

                    <Link
                      to={art.relatedActivityRoute}
                      className="touch-target w-full px-4 py-2.5 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      <span aria-hidden="true">▶️</span>
                      <span>{art.relatedActivityLabelEl}</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Full Article Copy */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#7A9A7B]/20 text-[#2C3539] text-xs font-extrabold">
                      {art.badgeEl}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold">
                      {art.channel}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3539] leading-snug">
                    {art.titleEl}
                  </h2>
                  <p className="text-sm font-bold text-[#4A6B82]">{art.subtitleEl}</p>

                  <div className="p-5 rounded-2xl bg-white border border-[#2C3539]/15 text-sm sm:text-base text-[#2C3539] whitespace-pre-line leading-relaxed font-medium">
                    {art.fullSocialPostEl}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {art.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-[#EFE8D8] text-[#4A6B82] text-xs font-extrabold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ParentArticlesPage;
