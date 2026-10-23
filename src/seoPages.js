// src/seoPages.js
//
// Each public page's title and description for search engines, read by
// src/components/RouteMeta.jsx and checked against public/sitemap.xml by
// tests/seo.test.jsx. No prices: a price lives only in the API and is fetched
// (CLAUDE.md, "Never invent a price").
export const SITE = 'https://easybranding.co.za';
const NAME = 'WABOS by Easy Branding AI';

export const PAGES = {
  '/': {
    title: 'WABOS: the WhatsApp operating system for small businesses | Easy Branding AI',
    description: 'WABOS answers your WhatsApp, qualifies leads, books jobs, takes payments and sends invoices, inside the WhatsApp you already use. Built in South Africa by Easy Branding AI.',
  },
  '/register': {
    title: `Sign up for WABOS | ${NAME}`,
    description: 'Start WABOS for your business: connect your WhatsApp number and let it answer, follow up and take payments for you.',
  },
  '/documentation': {
    title: `WABOS documentation | ${NAME}`,
    description: 'How WABOS works: the commands you send from your own WhatsApp, how leads are qualified and followed up, and how payments and invoices go out.',
  },
  '/help': {
    title: `Help and common questions | ${NAME}`,
    description: 'Answers to the questions small business owners ask about WABOS: setting up, your WhatsApp number, payments, and what the assistant says to customers.',
  },
};
