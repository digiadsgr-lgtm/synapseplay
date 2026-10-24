import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ADHD_PARENT_AND_B2B_ARTICLES,
  BLOG_SEO_METADATA,
  type AdhdArticlePost,
  type AdhdBlogTopicCategory,
} from '../data/adhdParentArticles';
import { SynapsePlayLogoMark } from '../components/SynapsePlayLogoMark';

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const ParentArticlesPage: React.FC = () => {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<'ALL' | AdhdBlogTopicCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeSingleArticle = useMemo<AdhdArticlePost | undefined>(
    () => (articleId ? ADHD_PARENT_AND_B2B_ARTICLES.find((a) => a.id === articleId) : undefined),
    [articleId]
  );

  const filteredArticles = useMemo(() => {
    return ADHD_PARENT_AND_B2B_ARTICLES.filter((art) => {
      if (selectedTopic !== 'ALL' && art.topicCategory !== selectedTopic) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        return (
          art.titleEl.toLowerCase().includes(q) ||
          art.subtitleEl.toLowerCase().includes(q) ||
          art.badgeEl.toLowerCase().includes(q) ||
          art.seoKeywords.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedTopic, searchQuery]);

  const homeRoutineCount = useMemo(
    () => ADHD_PARENT_AND_B2B_ARTICLES.filter((a) => a.topicCategory === 'home-routine').length,
    []
  );
  const emotionImpulseCount = useMemo(
    () => ADHD_PARENT_AND_B2B_ARTICLES.filter((a) => a.topicCategory === 'emotion-impulse').length,
    []
  );
  const clinicalScienceCount = useMemo(
    () => ADHD_PARENT_AND_B2B_ARTICLES.filter((a) => a.topicCategory === 'clinical-science').length,
    []
  );

  // Dynamic SEO Head Tags & Schema.org JSON-LD Structured Data
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseUrl = 'https://www.synapseplay.gr';

    if (activeSingleArticle) {
      const canonicalUrl = `${baseUrl}/articles/${activeSingleArticle.id}`;
      document.title = activeSingleArticle.seoTitleEl;
      upsertMetaTag('name', 'description', activeSingleArticle.seoMetaDescriptionEl);
      upsertMetaTag('name', 'keywords', activeSingleArticle.seoKeywords.join(', '));
      upsertMetaTag('property', 'og:title', activeSingleArticle.seoTitleEl);
      upsertMetaTag('property', 'og:description', activeSingleArticle.seoMetaDescriptionEl);
      upsertMetaTag('property', 'og:type', 'article');
      upsertMetaTag('property', 'og:url', canonicalUrl);
      upsertMetaTag('property', 'og:image', `${baseUrl}${activeSingleArticle.imageUrl}`);
      upsertCanonicalLink(canonicalUrl);
    } else {
      const canonicalUrl = `${baseUrl}/articles`;
      document.title = BLOG_SEO_METADATA.blogTitleEl;
      upsertMetaTag('name', 'description', BLOG_SEO_METADATA.blogMetaDescriptionEl);
      upsertMetaTag('name', 'keywords', BLOG_SEO_METADATA.blogKeywords.join(', '));
      upsertMetaTag('property', 'og:title', BLOG_SEO_METADATA.blogTitleEl);
      upsertMetaTag('property', 'og:description', BLOG_SEO_METADATA.blogMetaDescriptionEl);
      upsertMetaTag('property', 'og:type', 'website');
      upsertMetaTag('property', 'og:url', canonicalUrl);
      upsertMetaTag(
        'property',
        'og:image',
        `${baseUrl}/brand-kit/png/synapseplay-social-cover-dark-1200x630.png`
      );
      upsertCanonicalLink(canonicalUrl);
    }
  }, [activeSingleArticle]);

  const jsonLdSchema = useMemo(() => {
    const baseUrl = 'https://www.synapseplay.gr';
    if (activeSingleArticle) {
      return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: activeSingleArticle.titleEl,
        alternativeHeadline: activeSingleArticle.subtitleEl,
        description: activeSingleArticle.seoMetaDescriptionEl,
        image: `${baseUrl}${activeSingleArticle.imageUrl}`,
        datePublished: activeSingleArticle.publishedDateISO,
        dateModified: activeSingleArticle.publishedDateISO,
        inLanguage: 'el-GR',
        keywords: activeSingleArticle.seoKeywords.join(', '),
        author: {
          '@type': 'Organization',
          name: activeSingleArticle.authorEl,
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'SynapsePlay by DIGIADS',
          url: 'https://digiads.gr',
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}/articles/${activeSingleArticle.id}`,
        },
      };
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: BLOG_SEO_METADATA.blogHeadlineEl,
      description: BLOG_SEO_METADATA.blogMetaDescriptionEl,
      url: `${baseUrl}/articles`,
      inLanguage: 'el-GR',
      publisher: {
        '@type': 'Organization',
        name: 'SynapsePlay by DIGIADS',
        url: 'https://digiads.gr',
      },
      blogPost: ADHD_PARENT_AND_B2B_ARTICLES.map((art) => ({
        '@type': 'BlogPosting',
        headline: art.titleEl,
        description: art.seoMetaDescriptionEl,
        url: `${baseUrl}/articles/${art.id}`,
        datePublished: art.publishedDateISO,
        image: `${baseUrl}${art.imageUrl}`,
        keywords: art.seoKeywords.join(', '),
      })),
    };
  }, [activeSingleArticle]);

  return (
    <div
      data-testid="parent-articles-page"
      className="min-h-screen bg-[#EFE8D8] text-[#2C3539] font-sans pb-16"
    >
      {/* Structured Data JSON-LD for Google SEO */}
      <script
        type="application/ld+json"
        data-testid="blog-seo-jsonld"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Top Navigation */}
      <header className="border-b border-[#2C3539]/15 bg-[#FAF6EE] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <SynapsePlayLogoMark sizeClassName="w-11 h-11" />
            <div>
              <span className="text-lg font-extrabold text-[#2C3539]">SynapsePlay</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#7A9A7B]/20 text-[#2C3539] text-xs font-extrabold">
                🧠 Μυαλά που Τρέχουν με Χίλια • Blog ΔΕΠΥ
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeSingleArticle && (
              <button
                type="button"
                data-testid="back-to-all-articles-btn"
                onClick={() => navigate('/articles')}
                className="touch-target px-4 py-2 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/25 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-white"
              >
                ← Όλα τα Άρθρα του Blog
              </button>
            )}
            <Link
              to="/"
              data-testid="articles-back-home-link"
              className="touch-target px-4 py-2 rounded-2xl bg-white border border-[#2C3539]/20 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-[#EFE8D8]"
            >
              ← Αρχική Σελίδα
            </Link>
            <Link
              to="/app"
              data-testid="articles-launch-app-link"
              className="touch-target px-5 py-2.5 rounded-2xl bg-[#D97757] text-white text-xs sm:text-sm font-extrabold hover:opacity-95"
            >
              Δωρεάν Είσοδος στην Εφαρμογή →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* SEO Breadcrumb Navigation */}
        <nav aria-label="Διαδρομή Σελίδας (Breadcrumb)" className="text-xs font-extrabold text-[#4A6B82]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:underline">
                Αρχική SynapsePlay
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link to="/articles" className="hover:underline text-[#2C3539]">
                Μυαλά που Τρέχουν με Χίλια (Blog ΔΕΠΥ)
              </Link>
            </li>
            {activeSingleArticle && (
              <>
                <li aria-hidden="true">›</li>
                <li className="text-[#5B7B5C] truncate max-w-xs sm:max-w-md">
                  {activeSingleArticle.titleEl}
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Blog Hero Header */}
        {!activeSingleArticle && (
          <section
            aria-labelledby="adhd-blog-hero-heading"
            data-testid="adhd-blog-hero"
            className="bg-[#1B2225] text-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-10 space-y-5 shadow-md"
          >
            <div className="space-y-3 max-w-4xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7A9A7B]/30 border border-[#7A9A7B] text-xs font-extrabold text-[#EFE8D8]">
                🧠 Το Επίσημο Ιστολόγιο (Blog) Γονέων &amp; Ειδικών για τη ΔΕΠΥ (4–12 ετών)
              </span>
              <h1
                id="adhd-blog-hero-heading"
                className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#FAF6EE] leading-tight"
              >
                «Μυαλά που Τρέχουν με Χίλια» — Το Blog της ΔΕΠΥ
              </h1>
              <p className="text-sm sm:text-lg text-[#EFE8D8]/90 leading-relaxed">
                Για τα παιδιά που σκέφτονται με την ταχύτητα του φωτός, που δυσκολεύονται να πατήσουν
                «φρένο» και που χρειάζονται κατανόηση αντί για παρατηρήσεις. Εδώ θα βρείτε πρακτικές,
                δοκιμασμένες συμβουλές καθημερινότητας —χωρίς ξύλινες ιατρικές ορολογίες— που μπορείτε
                να εφαρμόσετε σήμερα κιόλας στο σπίτι και στο σχολείο.
              </p>
            </div>

            {/* Topic Filters & Search Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Κατηγορίες Άρθρων ΔΕΠΥ">
                <button
                  type="button"
                  data-testid="filter-articles-all"
                  onClick={() => setSelectedTopic('ALL')}
                  className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                    selectedTopic === 'ALL'
                      ? 'bg-[#7A9A7B] text-white border-[#7A9A7B]'
                      : 'bg-[#252F33] text-[#FAF6EE] border-white/15 hover:border-[#7A9A7B]'
                  }`}
                >
                  ✨ Όλα τα Θέματα ({ADHD_PARENT_AND_B2B_ARTICLES.length})
                </button>
                <button
                  type="button"
                  data-testid="filter-articles-home"
                  onClick={() => setSelectedTopic('home-routine')}
                  className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                    selectedTopic === 'home-routine'
                      ? 'bg-[#7A9A7B] text-white border-[#7A9A7B]'
                      : 'bg-[#252F33] text-[#FAF6EE] border-white/15 hover:border-[#7A9A7B]'
                  }`}
                >
                  🏠 Ρουτίνα, Οθόνη &amp; Μελέτη ({homeRoutineCount})
                </button>
                <button
                  type="button"
                  data-testid="filter-articles-emotion"
                  onClick={() => setSelectedTopic('emotion-impulse')}
                  className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                    selectedTopic === 'emotion-impulse'
                      ? 'bg-[#D97757] text-white border-[#D97757]'
                      : 'bg-[#252F33] text-[#FAF6EE] border-white/15 hover:border-[#D97757]'
                  }`}
                >
                  💛 Παρορμητικότητα, Θυμός &amp; Γονείς ({emotionImpulseCount})
                </button>
                <button
                  type="button"
                  data-testid="filter-articles-clinical"
                  onClick={() => setSelectedTopic('clinical-science')}
                  className={`touch-target px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-colors ${
                    selectedTopic === 'clinical-science'
                      ? 'bg-[#4A6B82] text-white border-[#4A6B82]'
                      : 'bg-[#252F33] text-[#FAF6EE] border-white/15 hover:border-[#4A6B82]'
                  }`}
                >
                  🩺 Ειδική Αγωγή, Νηπιαγωγείο &amp; Έρευνα ({clinicalScienceCount})
                </button>
              </div>

              <div className="w-full lg:w-72">
                <label htmlFor="blog-search-input" className="sr-only">
                  Αναζήτηση άρθρου για τη ΔΕΠΥ
                </label>
                <input
                  id="blog-search-input"
                  data-testid="blog-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Αναζήτηση (π.χ. θυμός, οθόνη, διάβασμα)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#252F33] border border-white/20 text-xs sm:text-sm font-bold text-[#FAF6EE] placeholder:text-[#EFE8D8]/60"
                />
              </div>
            </div>
          </section>
        )}

        {/* Free Beta Launch Callout Banner (High-Conversion Parent Magnet) */}
        <section
          aria-label="Δωρεάν Δοκιμή Πριν την Επίσημη Έναρξη"
          data-testid="blog-free-trial-urgency-banner"
          className="bg-[#FAF6EE] border-2 border-[#D97757] rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="space-y-1 max-w-3xl">
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#D97757]/15 text-[#D97757] text-xs font-extrabold">
              🎁 Ανοιχτή Δωρεάν Πρόσβαση (Beta) για Λίγες Ημέρες Ακόμα!
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#2C3539]">
              Δοκιμάστε σήμερα 100% Δωρεάν και τα 20 παιχνίδια ΔΕΠΥ με το παιδί σας!
            </h2>
            <p className="text-xs sm:text-sm text-[#2C3539]/85">
              Ανοίξτε την εφαρμογή αμέσως από το τάμπλετ ή τον υπολογιστή σας — χωρίς εγγραφή, χωρίς
              κάρτα και χωρίς διαφημίσεις— πριν την επίσημη ενεργοποίηση των συνδρομητικών πακέτων.
            </p>
          </div>
          <Link
            to="/app"
            data-testid="blog-banner-try-free-btn"
            className="touch-target px-6 py-3.5 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95 shrink-0 shadow-sm"
          >
            <span aria-hidden="true">▶️</span>
            <span>Δοκιμάστε την Εφαρμογή Δωρεάν Τώρα</span>
          </Link>
        </section>

        {/* Single Article View OR Full Blog Feed */}
        <div className="space-y-8">
          {(activeSingleArticle ? [activeSingleArticle] : filteredArticles).map((art) => (
            <article
              key={art.id}
              itemScope
              itemType="https://schema.org/BlogPosting"
              data-testid={`blog-article-card-${art.number}`}
              className="bg-[#FAF6EE] border-2 border-[#7A9A7B]/60 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left Column: Visual Card & Direct Game Launch CTA */}
              <div className="lg:col-span-4 space-y-4">
                <Link
                  to={`/articles/${art.id}`}
                  className="block rounded-2xl overflow-hidden border-2 border-[#2C3539]/20 shadow-sm bg-[#14191C] hover:opacity-95 transition-opacity"
                >
                  <img
                    itemProp="image"
                    src={art.imageUrl}
                    alt={art.titleEl}
                    loading="lazy"
                    className="w-full h-auto block"
                  />
                </Link>

                {/* Key Takeaways Box (Featured Snippet SEO) */}
                <div className="p-4 rounded-2xl bg-white border border-[#7A9A7B]/50 space-y-2">
                  <h3 className="text-xs font-extrabold text-[#5B7B5C] uppercase tracking-wider">
                    📌 Με μια ματιά — Τα 3 βασικά σημεία:
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#2C3539] font-bold leading-snug">
                    {art.keyTakeawaysEl.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#7A9A7B] shrink-0">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={art.relatedActivityRoute}
                    data-testid={`article-play-cta-${art.number}`}
                    className="touch-target w-full px-4 py-3 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-sm"
                  >
                    <span aria-hidden="true">▶️</span>
                    <span>{art.relatedActivityLabelEl}</span>
                  </Link>

                  {!activeSingleArticle && (
                    <Link
                      to={`/articles/${art.id}`}
                      data-testid={`open-single-article-${art.number}`}
                      className="touch-target w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#2C3539]/20 text-[#2C3539] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#EFE8D8]"
                    >
                      <span>📖 Προβολή Αυτόνομης Σελίδας Άρθρου</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Column: Full SEO-Structured Article Body */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                  <span className="px-3 py-1 rounded-full bg-[#7A9A7B]/20 text-[#2C3539]">
                    {art.badgeEl}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#4A6B82]/15 text-[#4A6B82]">
                    ⏱️ {art.readingTimeMinutes} λεπτά ανάγνωσης
                  </span>
                  <time
                    itemProp="datePublished"
                    dateTime={art.publishedDateISO}
                    className="px-2.5 py-1 rounded-full bg-[#EFE8D8] text-[#2C3539]/80"
                  >
                    ✍️ {art.authorEl}
                  </time>
                </div>

                <h2
                  itemProp="headline"
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#2C3539] leading-snug"
                >
                  <Link to={`/articles/${art.id}`} className="hover:text-[#4A6B82] transition-colors">
                    {art.titleEl}
                  </Link>
                </h2>

                <p itemProp="description" className="text-sm sm:text-base font-bold text-[#4A6B82]">
                  {art.subtitleEl}
                </p>

                <div
                  itemProp="articleBody"
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-[#2C3539]/15 text-sm sm:text-base text-[#2C3539] whitespace-pre-line leading-relaxed font-medium"
                >
                  {art.fullSocialPostEl}
                </div>

                {/* SEO Keywords & Topic Pills */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#2C3539]/70 mr-1">
                    Θεματικές ΔΕΠΥ:
                  </span>
                  {art.seoKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg bg-[#EFE8D8] text-[#4A6B82] text-xs font-extrabold"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom SEO Conversion Banner for Parents & Therapists */}
        <section
          aria-label="Δοκιμάστε το SynapsePlay"
          className="bg-[#FAF6EE] border-2 border-[#4A6B82] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
        >
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
              Έτοιμοι να κάνετε τα 5 λεπτά παιχνιδιού την πιο ήρεμη στιγμή της ημέρας;
            </h2>
            <p className="text-sm sm:text-base text-[#2C3539]/85">
              Το <strong>SynapsePlay (FocusEngine 5+)</strong> είναι διαθέσιμο σε ανοιχτή δωρεάν
              δοκιμή — χωρίς εγγραφή, χωρίς διαφημίσεις και 100% τοπικά στη συσκευή σας.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/app"
              className="touch-target px-6 py-3.5 rounded-2xl bg-[#D97757] text-white font-extrabold text-sm sm:text-base hover:opacity-95 shadow-sm"
            >
              Ξεκινήστε Δωρεάν Τώρα ▶️
            </Link>
            <Link
              to="/"
              className="touch-target px-5 py-3.5 rounded-2xl bg-white border-2 border-[#4A6B82] text-[#2C3539] font-extrabold text-sm hover:bg-[#EFE8D8]"
            >
              Πώς Λειτουργεί η Μέθοδος
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ParentArticlesPage;
