// What search engines read on easybranding.co.za: public/sitemap.xml,
// public/robots.txt and each page's own title, description and canonical
// (src/components/RouteMeta.jsx).
//
// Pinned because the failure is silent: until 2026-10-23 both files did not
// exist and the site answered them with its HTML, every page shared one title,
// and none named a canonical address. Nothing broke; Google just could not
// tell the pages apart.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import RouteMeta from '../src/components/RouteMeta'
import { PAGES, SITE } from '../src/seoPages'

// From the repo root, where vitest runs.
const read = (p) => readFileSync(resolve(cwd(), p), 'utf8')
const app = read('src/App.jsx')
const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1])
const sitemap = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const disallowed = [...read('public/robots.txt').matchAll(/^Disallow: (\S+)/gm)].map((m) => m[1])

const meta = async (path) => {
  render(<HelmetProvider><MemoryRouter initialEntries={[path]}><RouteMeta /></MemoryRouter></HelmetProvider>)
  await waitFor(() => expect(document.head.querySelector('link[rel="canonical"], meta[name="robots"]')).not.toBeNull())
  return {
    title: document.title,
    description: document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    robots: document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
  }
}

describe('the sitemap and robots.txt', () => {
  it('lists only real public routes, on the site\'s own address, none of them blocked', () => {
    expect(sitemap.length).toBeGreaterThan(5)
    for (const loc of sitemap) {
      expect(loc.startsWith(`${SITE}/`)).toBe(true)
      const path = loc.slice(SITE.length)
      expect(routes, `${path} in App.jsx`).toContain(path)
      expect(disallowed).not.toContain(path)
    }
  })

  it('blocks the areas behind a login and points to the sitemap', () => {
    for (const p of ['/superadmin', '/admin', '/agent', '/onboarding', '/login']) expect(disallowed).toContain(p)
    expect(read('public/robots.txt')).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })

  it('every page with its own title is in the sitemap', () => {
    for (const path of Object.keys(PAGES)) expect(sitemap).toContain(`${SITE}${path}`)
  })
})

describe('each page tells search engines what it is', () => {
  it('the home page has its own title, description and canonical', async () => {
    const m = await meta('/')
    expect(m.title).toBe(PAGES['/'].title)
    expect(m.description).toBe(PAGES['/'].description)
    expect(m.canonical).toBe(`${SITE}/`)
  })

  it('documentation names itself, without a trailing slash or query', async () => {
    const m = await meta('/documentation/?utm_source=x')
    expect(m.canonical).toBe(`${SITE}/documentation`)
    expect(m.title).toBe(PAGES['/documentation'].title)
  })

  it('the dashboards and sign-in are noindex', async () => {
    expect((await meta('/superadmin')).robots).toBe('noindex')
  })

  it('no title or description uses an em dash or names a price', () => {
    for (const p of Object.values(PAGES)) {
      expect(p.title + p.description).not.toMatch(/—|R\s?\d/)
    }
  })
})
