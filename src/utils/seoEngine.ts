import { ACTIVITIES, CATEGORIES, getActivityById, getCategoryById } from '../data/activitiesCatalog';
import {
  ADHD_PARENT_AND_B2B_ARTICLES,
  BLOG_SEO_METADATA,
} from '../data/adhdParentArticles';
import type { CategoryId } from '../types/domain';

export const SITE_BASE_URL = 'https://www.synapseplay.gr';
export const DEFAULT_OG_IMAGE = `${SITE_BASE_URL}/brand-kit/png/synapseplay-social-cover-dark-1200x630.png`;

export const SOCIAL_LINKS = {
  facebookUrl: 'https://www.facebook.com/Synapseplay.gr/',
  facebookLabel: 'Facebook • Synapseplay.gr',
  instagramUrl: 'https://www.instagram.com/synapseplay.gr/',
  instagramHandle: '@Synapseplay.gr',
} as const;

export interface SeoFaqItem {
  questionEl: string;
  answerEl: string;
  categoryEl: string;
}

export const ADHD_SEO_FAQ_ITEMS: SeoFaqItem[] = [
  {
    categoryEl: 'ΔΕΠΥ & Συγκέντρωση',
    questionEl: 'Πώς βοηθάει το SynapsePlay ένα παιδί 4–12 ετών με ΔΕΠΥ ή διάσπαση προσοχής;',
    answerEl:
      'Το SynapsePlay (FocusEngine 5+) συνδυάζει 20 σύντομες, ήρεμες δραστηριότητες εκτελεστικών λειτουργιών (οπτική αναζήτηση, εργαζόμενη μνήμη, αναστολή παρόρμησης, αλληλουχία βημάτων) με κίνηση στον φυσικό χώρο και ελληνική φωνητική καθοδήγηση, χωρίς αγχωτικά χρονόμετρα ή ποινές αποτυχίας.',
  },
  {
    categoryEl: 'Οθόνη & Αποσύνδεση',
    questionEl: 'Γιατί το παιδί μου ξεσπάει όταν κλείνει το τάμπλετ και πώς το λύνει το Smooth Landing;',
    answerEl:
      'Το απότομο κλείσιμο ενός παιχνιδιού που το παιδί απολαμβάνει είναι συχνά δύσκολη στιγμή. Το Smooth Landing του SynapsePlay προειδοποιεί ήπια 2 λεπτά πριν από τη λήξη, δείχνει τον χρόνο με ένα δαχτυλίδι που αδειάζει (χωρίς αγχωτικούς αριθμούς) και προτείνει μια ήρεμη δραστηριότητα εκτός οθόνης.',
  },
  {
    categoryEl: 'Ηλικίες 4–12 Ετών',
    questionEl: 'Πώς προσαρμόζονται τα παιχνίδια στην ηλικία του παιδιού (4–5, 5–6, 6–8, 8–10, 10–12 ετών);',
    answerEl:
      'Με 1 κλικ στην ηλικιακή ομάδα του παιδιού, η εφαρμογή προσαρμόζει αυτόματα τον αριθμό των ερεθισμάτων, το μέγεθος των εικόνων, την ταχύτητα της ελληνικής φωνής και την προτεινόμενη διάρκεια συνεδρίας (από 10 λεπτά για προσχολική ηλικία έως 20 λεπτά για Ε΄–ΣΤ΄ Δημοτικού).',
  },
  {
    categoryEl: 'Ειδική Αγωγή & Θεραπευτές',
    questionEl: 'Μπορεί να χρησιμοποιηθεί από Εργοθεραπευτές, Λογοθεραπευτές και Κέντρα Ειδικών Θεραπειών;',
    answerEl:
      'Ναι, ως συμπληρωματικό εργαλείο εξάσκησης. Οι δραστηριότητες εμπνέονται από ιδέες 8 ειδικοτήτων (Εργοθεραπεία, Λογοθεραπεία, Παιδοψυχολογία, Παιδοψυχιατρική, Φυσιατρική, Κοινωνική Εργασία, Μουσικοκινητική και Θεατρική Αγωγή), χωρίς να υποκαθιστούν την αξιολόγηση και τη θεραπεία από τον ειδικό. Υπάρχει άδεια Therapist Pro με απεριόριστα προφίλ παιδιών.',
  },
  {
    categoryEl: 'Αυτοπεποίθηση & Errorless Learning',
    questionEl: 'Γιατί δεν υπάρχουν πόντοι, «Game Over» ή κόκκινο Χ λάθους στα παιχνίδια;',
    answerEl:
      'Τα παιδιά με ΔΕΠΥ βιώνουν καθημερινά έντονη ματαίωση από συνεχείς παρατηρήσεις. Η παιδαγωγική προσέγγιση Μηδενικής Ματαίωσης (Errorless Learning) αντικαθιστά την αποτυχία με διαβαθμισμένη βοήθεια (Hint Ladder 2 επιπέδων) και ήρεμη ενθάρρυνση, χτίζοντας την αυτοπεποίθηση του παιδιού.',
  },
  {
    categoryEl: 'Ασφάλεια & GDPR',
    questionEl: 'Είναι ασφαλή τα δεδομένα του παιδιού μου; Χρειάζεται δημιουργία λογαριασμού;',
    answerEl:
      'Το SynapsePlay έχει αναπτυχθεί από την DIGIADS με αρχιτεκτονική 100% Privacy-by-Design (ΓΚΠΔ / GDPR). Δεν απαιτεί εγγραφή με email, δεν περιέχει διαφημίσεις και αποθηκεύει όλα τα προφίλ και το ιστορικό αποκλειστικά τοπικά στη συσκευή σας (IndexedDB).',
  },
];

export interface RouteSeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogType: 'website' | 'article';
  ogImage: string;
  jsonLd: Record<string, unknown>;
}

export function resolveRouteSeoMetadata(pathname: string): RouteSeoMetadata {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const canonicalUrl = `${SITE_BASE_URL}${cleanPath === '/' ? '/' : cleanPath}`;

  // 1. Single Blog Article (/articles/:articleId)
  if (cleanPath.startsWith('/articles/')) {
    const slug = cleanPath.replace('/articles/', '');
    const article = ADHD_PARENT_AND_B2B_ARTICLES.find((a) => a.id === slug);
    if (article) {
      return {
        title: article.seoTitleEl,
        description: article.seoMetaDescriptionEl,
        keywords: article.seoKeywords,
        canonicalUrl,
        ogType: 'article',
        ogImage: `${SITE_BASE_URL}${article.imageUrl}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.titleEl,
          alternativeHeadline: article.subtitleEl,
          description: article.seoMetaDescriptionEl,
          image: `${SITE_BASE_URL}${article.imageUrl}`,
          datePublished: article.publishedDateISO,
          dateModified: article.publishedDateISO,
          inLanguage: 'el-GR',
          keywords: article.seoKeywords.join(', '),
          author: {
            '@type': 'Organization',
            name: article.authorEl,
            url: SITE_BASE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: 'SynapsePlay by DIGIADS',
            url: 'https://digiads.gr',
            sameAs: [
              SOCIAL_LINKS.facebookUrl,
              SOCIAL_LINKS.instagramUrl,
              'https://digiads.gr',
            ],
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
        },
      };
    }
  }

  // 2. Main Blog Index (/articles)
  if (cleanPath === '/articles') {
    return {
      title: BLOG_SEO_METADATA.blogTitleEl,
      description: BLOG_SEO_METADATA.blogMetaDescriptionEl,
      keywords: BLOG_SEO_METADATA.blogKeywords,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: BLOG_SEO_METADATA.blogHeadlineEl,
        description: BLOG_SEO_METADATA.blogMetaDescriptionEl,
        url: canonicalUrl,
        inLanguage: 'el-GR',
        publisher: {
          '@type': 'Organization',
          name: 'SynapsePlay by DIGIADS',
          url: 'https://digiads.gr',
        },
      },
    };
  }

  // 3. Individual Activity Route (/activity/:activityId)
  if (cleanPath.startsWith('/activity/')) {
    const actId = cleanPath.replace('/activity/', '');
    const act = getActivityById(actId);
    if (act) {
      const title = `${act.titleEl} — Παιχνίδι ΔΕΠΥ (${act.executiveDomain}) | SynapsePlay`;
      const description = `${act.subtitleEl}. ${act.parentGuidanceEl} Διαδραστική δραστηριότητα για παιδιά 4–12 ετών με ΔΕΠΥ (${act.specialistDisciplines.join(', ')}).`;
      return {
        title,
        description,
        keywords: [
          act.titleEl,
          act.executiveDomain,
          'παιχνίδι ΔΕΠΥ',
          ...act.specialistDisciplines,
          'SynapsePlay',
        ],
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: `${act.code}. ${act.titleEl} (${act.titleEn})`,
          description,
          url: canonicalUrl,
          inLanguage: 'el-GR',
          learningResourceType: 'Interactive Educational Game',
          educationalUse: act.executiveDomain,
          typicalAgeRange: '4-12',
          provider: {
            '@type': 'Organization',
            name: 'SynapsePlay by DIGIADS',
            url: SITE_BASE_URL,
          },
        },
      };
    }
  }

  // 4. Category Route (/category/:categoryId)
  if (cleanPath.startsWith('/category/')) {
    const catId = cleanPath.replace('/category/', '') as CategoryId;
    const cat = getCategoryById(catId);
    if (cat) {
      const title = `${cat.titleEl} — Παιχνίδια Συγκέντρωσης & ΔΕΠΥ (Ομάδα ${cat.groupCode}) | SynapsePlay`;
      const description = `${cat.subtitleEl}. ${cat.voicePromptEl} Εξάσκηση για παιδιά 4–12 ετών με ΔΕΠΥ χωρίς ματαίωση.`;
      return {
        title,
        description,
        keywords: [cat.titleEl, cat.subtitleEl, 'παιχνίδια ΔΕΠΥ', 'συγκέντρωση παιδί', 'SynapsePlay'],
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: canonicalUrl,
          inLanguage: 'el-GR',
        },
      };
    }
  }

  // 5. Child App Hub (/app)
  if (cleanPath === '/app') {
    return {
      title: 'Περιβάλλον Παιδιού & 20 Παιχνίδια ΔΕΠΥ (4–12 ετών) | SynapsePlay',
      description:
        'Διαλέξτε την ηλικία του παιδιού (4–12 ετών) και τον αγαπημένο του Θεραπευτικό Συνοδό και ξεκινήστε 5 λεπτά ήρεμης εξάσκησης προσοχής, μνήμης και αυτορρύθμισης.',
      keywords: [
        'εφαρμογή ΔΕΠΥ',
        'παιχνίδια συγκέντρωσης για παιδιά',
        'εργαζόμενη μνήμη ασκήσεις',
        'αυτορρύθμιση παιδί',
        'SynapsePlay app',
      ],
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'SynapsePlay (FocusEngine 5+)',
        url: canonicalUrl,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        inLanguage: 'el-GR',
      },
    };
  }

  // 6. Legal & GDPR Center (/legal)
  if (cleanPath === '/legal') {
    return {
      title: 'Νομικό Κέντρο, Όροι Χρήσης & 100% Συμμόρφωση GDPR | SynapsePlay by DIGIADS',
      description:
        'Πολιτική Ιδιωτικότητας, Προστασία Δεδομένων Ανηλίκων (Άρθρο 8 ΓΚΠΔ), Privacy-by-Design τοπική αποθήκευση και Όροι Χρήσης του SynapsePlay από την DIGIADS.',
      keywords: ['GDPR παιδική εφαρμογή', 'όροι χρήσης SynapsePlay', 'πολιτική απορρήτου DIGIADS'],
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Νομικό Κέντρο & Συμμόρφωση GDPR — SynapsePlay',
        url: canonicalUrl,
        inLanguage: 'el-GR',
      },
    };
  }

  // 7. Parent & Therapist Dashboard (/parent)
  if (cleanPath === '/parent') {
    return {
      title: 'Πίνακας Γονέων, Παιδαγωγών & Θεραπευτών (B2B) | SynapsePlay',
      description:
        'Ρυθμίσεις ηλικιακού πρωτοκόλλου (4–12 ετών), Smooth Landing, 8 διεπιστημονικές ειδικότητες ΔΕΠΥ, στατιστικά προόδου και διαχείριση αδειών SynapsePlay.',
      keywords: ['πίνακας γονέων ΔΕΠΥ', 'εργαλείο θεραπευτών ειδικής αγωγής', 'SynapsePlay Therapist Pro'],
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Πίνακας Γονέων & Θεραπευτών — SynapsePlay',
        url: canonicalUrl,
        inLanguage: 'el-GR',
      },
    };
  }

  // 8. Default / Landing Page (/)
  return {
    title:
      'SynapsePlay — Παιχνίδια Προσοχής, Μνήμης & Αυτορρύθμισης για Παιδιά με ΔΕΠΥ (4–12 ετών)',
    description:
      '«Το μυαλό μου τρέχει γρήγορα!» Ήρεμη, παιδαγωγική εξάσκηση συγκέντρωσης, μνήμης και αυτορρύθμισης για παιδιά 4–12 ετών με ΔΕΠΥ, γονείς και ειδικούς θεραπευτές. Χωρίς «έχασες», χωρίς διαφημίσεις.',
    keywords: [
      'ΔΕΠΥ',
      'παιδί με ΔΕΠΥ',
      'διάσπαση προσοχής παιδί',
      'υπερκινητικότητα παρορμητικότητα',
      'παιχνίδια συγκέντρωσης για παιδιά',
      'εργοθεραπεία ΔΕΠΥ',
      'λογοθεραπεία ΔΕΠΥ',
      'παιδοψυχολογία αυτορρύθμιση',
      'Μυαλά που Τρέχουν με Χίλια',
      'SynapsePlay',
    ],
    canonicalUrl: `${SITE_BASE_URL}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'SynapsePlay (FocusEngine 5+)',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web, iPadOS, Android, Windows, macOS',
          inLanguage: 'el-GR',
          url: `${SITE_BASE_URL}/`,
          description:
            'Παιδαγωγική πλατφόρμα εξάσκησης εκτελεστικών λειτουργιών, προσοχής, εργαζόμενης μνήμης και αυτορρύθμισης για παιδιά 4–12 ετών με ΔΕΠΥ.',
          creator: {
            '@type': 'Organization',
            name: 'DIGIADS',
            url: 'https://digiads.gr',
            sameAs: [
              SOCIAL_LINKS.facebookUrl,
              SOCIAL_LINKS.instagramUrl,
              'https://digiads.gr',
            ],
          },
          offers: {
            '@type': 'Offer',
            price: '0.00',
            priceCurrency: 'EUR',
            description: 'Δωρεάν Ανοιχτή Δοκιμή (Beta) & Οικογενειακά / Επαγγελματικά Πλάνα B2B',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: ADHD_SEO_FAQ_ITEMS.map((faq) => ({
            '@type': 'Question',
            name: faq.questionEl,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answerEl,
            },
          })),
        },
        {
          '@type': 'ItemList',
          name: '20 Διεπιστημονικές Δραστηριότητες ΔΕΠΥ του SynapsePlay',
          itemListOrder: 'https://schema.org/ItemListOrderAscending',
          numberOfItems: ACTIVITIES.length,
          itemListElement: ACTIVITIES.map((act, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: `${act.code}. ${act.titleEl} (${act.executiveDomain})`,
            url: `${SITE_BASE_URL}/activity/${act.id}`,
          })),
        },
        {
          '@type': 'ItemList',
          name: 'Οι 4 Βασικοί Πυλώνες Εκτελεστικών Λειτουργιών',
          numberOfItems: CATEGORIES.length,
          itemListElement: CATEGORIES.map((cat, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: cat.titleEl,
            url: `${SITE_BASE_URL}/category/${cat.id}`,
          })),
        },
      ],
    },
  };
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Returns all 51 canonical routes listed in public/sitemap.xml for build-time static HTML pre-rendering.
 */
export function getAllPrerenderRoutes(): string[] {
  const coreRoutes = ['/', '/app', '/articles', '/parent', '/legal'];
  const articleRoutes = ADHD_PARENT_AND_B2B_ARTICLES.map((a) => `/articles/${a.id}`);
  const categoryRoutes = CATEGORIES.map((c) => `/category/${c.id}`);
  const activityRoutes = ACTIVITIES.map((a) => `/activity/${a.id}`);
  return [...coreRoutes, ...articleRoutes, ...categoryRoutes, ...activityRoutes];
}

/**
 * Generates semantic Greek HTML body content for each route so that Googlebot Wave 1
 * (initial HTTP crawl before JS execution) sees 100% unique content and self-referencing canonicals.
 */
export function buildStaticSeoBodyHtml(pathname: string): string {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (cleanPath.startsWith('/articles/')) {
    const slug = cleanPath.replace('/articles/', '');
    const article = ADHD_PARENT_AND_B2B_ARTICLES.find((a) => a.id === slug);
    if (article) {
      const takeawaysHtml = article.keyTakeawaysEl
        .map((t) => `<li>${escapeHtmlAttr(t)}</li>`)
        .join('');
      const paragraphsHtml = article.fullSocialPostEl
        .split('\n\n')
        .filter((p) => p.trim().length > 0)
        .map((p) => `<p>${escapeHtmlAttr(p.trim())}</p>`)
        .join('');
      return `<main data-prerendered-seo="article"><article><h1>${escapeHtmlAttr(
        article.titleEl
      )}</h1><p><strong>${escapeHtmlAttr(article.subtitleEl)}</strong></p><p>${escapeHtmlAttr(
        article.seoMetaDescriptionEl
      )}</p><section><h2>Βασικά Σημεία Κλινικής &amp; Παιδαγωγικής Καθοδήγησης</h2><ul>${takeawaysHtml}</ul></section><section>${paragraphsHtml}</section><nav><a href="/articles">← Όλα τα Άρθρα του Blog ΔΕΠΥ</a> | <a href="${escapeHtmlAttr(
        article.relatedActivityRoute
      )}">Δοκιμάστε τη Δραστηριότητα: ${escapeHtmlAttr(
        article.relatedActivityLabelEl
      )}</a> | <a href="/app">Είσοδος στην Εφαρμογή SynapsePlay</a></nav></article></main>`;
    }
  }

  if (cleanPath === '/articles') {
    const listHtml = ADHD_PARENT_AND_B2B_ARTICLES.map(
      (art) =>
        `<li><article><h2><a href="/articles/${art.id}">${escapeHtmlAttr(
          art.titleEl
        )}</a></h2><p>${escapeHtmlAttr(art.seoMetaDescriptionEl)}</p></article></li>`
    ).join('');
    return `<main data-prerendered-seo="articles-index"><h1>${escapeHtmlAttr(
      BLOG_SEO_METADATA.blogHeadlineEl
    )}</h1><p>${escapeHtmlAttr(
      BLOG_SEO_METADATA.blogSubtitleEl
    )}</p><ul>${listHtml}</ul><nav><a href="/">Αρχική Σελίδα SynapsePlay</a> | <a href="/app">Δωρεάν Δοκιμή Εφαρμογής</a></nav></main>`;
  }

  if (cleanPath.startsWith('/activity/')) {
    const actId = cleanPath.replace('/activity/', '');
    const act = getActivityById(actId);
    if (act) {
      return `<main data-prerendered-seo="activity"><article><h1>${escapeHtmlAttr(
        `${act.code}. ${act.titleEl} (${act.titleEn})`
      )}</h1><h2>${escapeHtmlAttr(act.subtitleEl)}</h2><p>${escapeHtmlAttr(
        act.parentGuidanceEl
      )}</p><p>Τομέας Εκτελεστικής Λειτουργίας: ${escapeHtmlAttr(
        act.executiveDomain
      )}</p><p>Διεπιστημονικές Ειδικότητες: ${escapeHtmlAttr(
        act.specialistDisciplines.join(', ')
      )}</p><nav><a href="/category/${act.categoryId}">Κατηγορία</a> | <a href="/app">Όλα τα Παιχνίδια ΔΕΠΥ</a> | <a href="/articles">Blog Γονέων ΔΕΠΥ</a></nav></article></main>`;
    }
  }

  if (cleanPath.startsWith('/category/')) {
    const catId = cleanPath.replace('/category/', '') as CategoryId;
    const cat = getCategoryById(catId);
    if (cat) {
      const catActs = ACTIVITIES.filter((a) => a.categoryId === cat.id)
        .map(
          (a) =>
            `<li><a href="/activity/${a.id}">${escapeHtmlAttr(
              `${a.code}. ${a.titleEl}`
            )}</a> — ${escapeHtmlAttr(a.subtitleEl)}</li>`
        )
        .join('');
      return `<main data-prerendered-seo="category"><h1>${escapeHtmlAttr(
        cat.titleEl
      )}</h1><h2>${escapeHtmlAttr(cat.subtitleEl)}</h2><p>${escapeHtmlAttr(
        cat.voicePromptEl
      )}</p><ul>${catActs}</ul><nav><a href="/app">Περιβάλλον Παιδιού</a> | <a href="/">Αρχική</a></nav></main>`;
    }
  }

  const seo = resolveRouteSeoMetadata(cleanPath);
  return `<main data-prerendered-seo="page"><h1>${escapeHtmlAttr(
    seo.title
  )}</h1><p>${escapeHtmlAttr(
    seo.description
  )}</p><nav><a href="/">Αρχική Σελίδα</a> | <a href="/app">Περιβάλλον Παιδιού (20 Παιχνίδια ΔΕΠΥ)</a> | <a href="/articles">Blog «Μυαλά που Τρέχουν με Χίλια» (22 Άρθρα)</a> | <a href="/parent">Πίνακας Γονέων & Θεραπευτών</a> | <a href="/legal">Νομικό Κέντρο & GDPR</a></nav></main>`;
}

/**
 * Injects route-specific <title>, <meta>, self-referencing <link rel="canonical">, hreflang,
 * Schema.org JSON-LD, and semantic body HTML into the raw index.html template for static pre-rendering.
 */
export function injectSeoIntoHtmlTemplate(htmlTemplate: string, pathname: string): string {
  const seo = resolveRouteSeoMetadata(pathname);
  const escapedTitle = escapeHtmlAttr(seo.title);
  const escapedDesc = escapeHtmlAttr(seo.description);
  const escapedKeywords = escapeHtmlAttr(seo.keywords.join(', '));
  const escapedCanonical = escapeHtmlAttr(seo.canonicalUrl);
  const escapedOgImage = escapeHtmlAttr(seo.ogImage);

  let html = htmlTemplate;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapedDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${escapedKeywords}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapedCanonical}" />`
  );
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="el-GR"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="el-GR" href="${escapedCanonical}" />`
  );
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="x-default"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="x-default" href="${escapedCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${seo.ogType}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapedCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapedDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapedOgImage}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapedDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapedOgImage}" />`
  );

  // Inject static Schema.org JSON-LD right before </head> (idempotent replacement)
  html = html.replace(
    /\s*<script type="application\/ld\+json" id="static-route-jsonld">[\s\S]*?<\/script>/gi,
    ''
  );
  const jsonLdScript = `\n    <script type="application/ld+json" id="static-route-jsonld">${JSON.stringify(
    seo.jsonLd
  )}</script>\n  </head>`;
  html = html.replace(/\s*<\/head>/i, jsonLdScript);

  // Inject static semantic HTML content inside <div id="root">...</div> (idempotent replacement)
  const bodyHtml = buildStaticSeoBodyHtml(pathname);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${bodyHtml}</div>`);

  return html;
}
