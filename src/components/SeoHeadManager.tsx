import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveRouteSeoMetadata } from '../utils/seoEngine';

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
  const seo = resolveRouteSeoMetadata(location.pathname);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = seo.title;
    setOrCreateMeta('name', 'description', seo.description);
    setOrCreateMeta('name', 'keywords', seo.keywords.join(', '));
    setOrCreateMeta('property', 'og:title', seo.title);
    setOrCreateMeta('property', 'og:description', seo.description);
    setOrCreateMeta('property', 'og:type', seo.ogType);
    setOrCreateMeta('property', 'og:url', seo.canonicalUrl);
    setOrCreateMeta('property', 'og:image', seo.ogImage);
    setOrCreateMeta('property', 'og:locale', 'el_GR');
    setOrCreateMeta('name', 'twitter:title', seo.title);
    setOrCreateMeta('name', 'twitter:description', seo.description);
    setOrCreateMeta('name', 'twitter:image', seo.ogImage);

    setOrCreateLink('canonical', seo.canonicalUrl);
    setOrCreateLink('alternate', seo.canonicalUrl, 'el-GR');
    setOrCreateLink('alternate', seo.canonicalUrl, 'x-default');

    // Push virtual pageview to Google Tag Manager dataLayer on SPA route change
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'virtual_pageview',
        page_path: location.pathname,
        page_title: seo.title,
        page_location: seo.canonicalUrl,
      });
    }
  }, [location.pathname, seo]);

  return (
    <script
      type="application/ld+json"
      data-testid="global-route-seo-jsonld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
    />
  );
};
