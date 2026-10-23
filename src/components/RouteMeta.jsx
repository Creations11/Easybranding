// src/components/RouteMeta.jsx
//
// What search engines read for each page: its own title, description and
// canonical address, and "noindex" on everything behind a login. Until
// 2026-10-23 every page carried index.html's one title and description, and
// none named a canonical address, so to Google the whole site was one page
// said ten times. Google runs the app before indexing it, so setting these
// here, per route, is what it sees.
//
// The legal pages (Legal.jsx) set their own through LegalLayout, so they are
// left alone here: two Helmets naming two titles is a coin toss.
//
// No prices in here. A price lives only in the API's config/products.js and is
// fetched (CLAUDE.md, "Never invent a price"); a description that names one
// goes stale the day the price changes.
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { PAGES, SITE } from '../seoPages';

// Public, but not worth a place in search: a sign-in form, and pages that
// only make sense after one.
const NOINDEX = ['/login', '/pending', '/superadmin', '/agent', '/admin', '/onboarding', '/continue'];
// Set by LegalLayout itself.
const OWN_META = ['/terms', '/privacy', '/refund-policy', '/data-deletion', '/contact'];

export default function RouteMeta() {
  const { pathname } = useLocation();
  // index.html's own description and share tags are for crawlers that do not
  // run the app. Once it runs, each page sets its own, and the originals would
  // sit beside them as a second, generic description (see index.html).
  useEffect(() => {
    document.querySelectorAll('head [data-static-meta]').forEach((n) => n.remove());
  }, []);
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (OWN_META.includes(path)) return null;
  if (NOINDEX.includes(path)) {
    return <Helmet><meta name="robots" content="noindex" /></Helmet>;
  }
  const page = PAGES[path];
  if (!page) return null;
  const url = `${SITE}${path === '/' ? '/' : path}`;
  return (
    <Helmet>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
}
