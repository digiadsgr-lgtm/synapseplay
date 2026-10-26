import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
// seoEngine pulls in all blog articles (~100KB text) → load it on demand, outside the main bundle
type RouteSeoMetadata = ReturnType<typeof import('../utils/seoEngine').resolveRouteSeoMetadata>;

function setOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOrCreateLink(rel: string, href: string, hrefLang?: string) {
  if (typeof document === 'undefined') return;
  const selector = hrefLang
    ? `link[rel="${rel}"][hreflang="${hrefLang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (hrefLang) {
      link.setAttribute('hreflang', hrefLang);
    }
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const SeoHeadManager: React.FC = () => {
  const location = useLocation();
  const [seo, setSeo] = useState<RouteSeoMetadata | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let alive = true;
    void import('../utils/seoEngine').then(({ resolveRouteSeoMetadata }) => {
      if (!alive) return;
      const meta = resolveRouteSeoMetadata(location.pathname);
      setSeo(meta);

      document.title = meta.title;
      setOrCreateMeta('name', 'description', meta.description);
      setOrCreateMeta('name', 'keywords', meta.keywords.join(', '));
      setOrCreateMeta('property', 'og:title', meta.title);
      setOrCreateMeta('property', 'og:description', meta.description);
      setOrCreateMeta('property', 'og:type', meta.ogType);
      setOrCreateMeta('property', 'og:url', meta.canonicalUrl);
      setOrCreateMeta('property', 'og:image', meta.ogImage);
      setOrCreateMeta('property', 'og:locale', 'el_GR');
      setOrCreateMeta('name', 'twitter:title', meta.title);
      setOrCreateMeta('name', 'twitter:description', meta.description);
      setOrCreateMeta('name', 'twitter:image', meta.ogImage);

      setOrCreateLink('canonical', meta.canonicalUrl);
      setOrCreateLink('alternate', meta.canonicalUrl, 'el-GR');
      setOrCreateLink('alternate', meta.canonicalUrl, 'x-default');

      // Push virtual pageview to Google Tag Manager dataLayer on SPA route change
      if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: 'virtual_pageview',
          page_path: location.pathname,
          page_title: meta.title,
          page_location: meta.canonicalUrl,
        });
      }
    });
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  if (!seo) return null;
  return (
    <script
      type="application/ld+json"
      data-testid="global-route-seo-jsonld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c') }}
    />
  );
};
