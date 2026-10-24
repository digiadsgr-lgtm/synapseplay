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
      'Τα συνηθισμένα παιχνίδια προκαλούν απότομη υπερδιέγερση ντοπαμίνης, με αποτέλεσμα το ξαφνικό κλείσιμο της οθόνης να προκαλεί σοκ στο νευρικό σύστημα του παιδιού. Το πρωτόκολλο Smooth Landing (Module 13) του SynapsePlay χαμηλώνει προοδευτικά τον ρυθμό 2 λεπτά πριν τη λήξη και οδηγεί το παιδί σε ήρεμη αποσύνδεση με φυσική κίνηση.',
  },
  {
    categoryEl: 'Ηλικίες 4–12 Ετών',
    questionEl: 'Πώς προσαρμόζονται τα παιχνίδια στην ηλικία του παιδιού (4–5, 5–6, 6–8, 8–10, 10–12 ετών);',
    answerEl:
      'Με 1 κλικ στην ηλικιακή ομάδα του παιδιού, η εφαρμογή προσαρμόζει αυτόματα τον αριθμό των ερεθισμάτων, το μέγεθος των εικόνων, την ταχύτητα της ελληνικής φωνής και τη προτεινόμενη διάρκεια συνεδρίας (από 10 λεπτά για προσχολική ηλικία έως 20 λεπτά για Ε΄–ΣΤ΄ Δημοτικού).',
  },
  {
    categoryEl: 'Ειδική Αγωγή & Θεραπευτές',
    questionEl: 'Μπορεί να χρησιμοποιηθεί από Εργοθεραπευτές, Λογοθεραπευτές και Κέντρα Ειδικών Θεραπειών;',
    answerEl:
      'Ναι. Το SynapsePlay ενσωματώνει 8 διεπιστημονικά πρωτόκολλα (Εργοθεραπεία, Λογοθεραπεία, Παιδοψυχολογία, Παιδοψυχιατρική, Φυσιατρική/Ιδιοδεκτικότητα, Κοινωνική Εργασία, Μουσικοκινητική και Θεατρική Αγωγή) και προσφέρει ειδική άδεια Therapist Pro B2B με απεριόριστα τοπικά προφίλ παιδιών.',
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
