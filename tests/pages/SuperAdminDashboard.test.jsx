import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import SuperAdminDashboard from '../../src/pages/SuperAdminDashboard'

// Drive useMediaQuery from a test. Desktop unless a test says otherwise.
const setViewport = (mobile) =>
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: mobile && query.includes('max-width'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })))

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

// Every response resolver useDashboardData.js's query functions expect,
// keyed by the exact URL each hook calls — see src/hooks/useDashboardData.js.
const ROUTE_DEFAULTS = {
  '/admin-ops/overview': { data: { data: { overview: null } } },
  '/leads': { data: { data: { leads: [] } } },
  '/admin-ops/conversations/active': { data: { data: { leads: [] } } },
  '/admin-ops/leads/qualified': { data: { data: { leads: [] } } },
  '/admin-ops/leads/rejected': { data: { data: { leads: [] } } },
  '/admin-ops/leads/closed': { data: { data: { leads: [] } } },
  '/admin-ops/stages': { data: { data: { stages: [] } } },
  '/admin-ops/viewings': { data: { data: { viewings: [] } } },
  '/admin-ops/messages/recent': { data: { data: { messages: [] } } },
  '/admin-ops/alerts': { data: { data: { alerts: [] } } },
  '/admin-ops/owed-work': { data: { data: { items: [], total: 0, counts: {} } } },
  '/admin-ops/money': { data: { data: null } },
  '/admin-ops/health-warnings': { data: { data: { warnings: [], total: 0 } } },
  '/tenants': { data: { data: { tenants: [] } } },
  '/tenants/stats': { data: { data: { stats: null } } },
  '/users': { data: { data: { users: [] } } },
  '/users/pending': { data: { data: { users: [] } } },
  '/admin-ops/agents': { data: { data: { agents: [] } } },
  '/admin-ops/automation/flow-templates': { data: { data: { templates: [] } } },
}

const mockApiGet = (overrides = {}) => {
  const routes = { ...ROUTE_DEFAULTS, ...overrides }
  api.get.mockImplementation((url) => {
    // Match by PATH, ignoring the query string, so a hook adding params
    // (e.g. ?limit=100 on active conversations, or ?tenantId= from the
    // scope selector) doesn't require re-keying every mocked route.
    const path = url.split('?')[0]
    if (path in routes) return Promise.resolve(routes[path])
    throw new Error(`Unmocked api.get call in test: ${url}`)
  })
}

beforeEach(() => {
  localStorage.clear()
  api.get.mockReset()
  api.post.mockReset()
  // useHealth() calls global fetch directly (not api.get), gated on
  // isSuperAdmin — stub it so the default super_admin fixture user
  // doesn't trigger a real network call.
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ status: 'ok' }) })))
  // jsdom implements no layout, so scrollIntoView doesn't exist. LeadDetailModal
  // scrolls its thread to the bottom on open — without this, any test that
  // opens a lead dies inside an effect rather than at its own assertion.
  Element.prototype.scrollIntoView = vi.fn()
  // jsdom has no matchMedia. useMediaQuery already falls back to false without
  // it, but stubbing explicitly lets a test choose the viewport.
  setViewport(false)
})

describe('SuperAdminDashboard', () => {
  it('shows the loading state while overview/tenants/activeLeads are all still empty', () => {
    mockApiGet()
    renderWithProviders(<SuperAdminDashboard />)
    expect(screen.getByText('Loading platform data...')).toBeInTheDocument()
  })

  it('renders Operations/Overview stat cards and a lead name once data loads', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 42, activeConversations: 5, qualifiedLeads: 10,
        rejectedLeads: 3, todayLeads: 2, qualificationRate: 24,
      } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Naledi', phone: '+27821111111', workflowStatus: 'qualified' },
      ] } } },
    })

    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Naledi')).toBeInTheDocument()
  })

  it('the Leads CRM board renders column counts and lead cards after switching tabs', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 1, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Sipho', phone: '+27822222222', workflowStatus: 'new', takenOver: false },
      ] } } },
    })

    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'leads' }))

    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())
    expect(screen.getByText('✋ Take over')).toBeInTheDocument()
  })

  it('clicking Take over calls api.post with the right takeover endpoint', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 1, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Sipho', phone: '+27822222222', workflowStatus: 'new', takenOver: false },
      ] } } },
    })
    api.post.mockResolvedValue({ data: { success: true } })

    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'leads' }))
    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())

    fireEvent.click(screen.getByText('✋ Take over'))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/lead1/takeover'))
  })

  it('a rejected takeover call surfaces the API error message via alert', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 1, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Sipho', phone: '+27822222222', workflowStatus: 'new', takenOver: false },
      ] } } },
    })
    api.post.mockRejectedValue({ response: { data: { message: 'Takeover failed: cap reached' } } })
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'leads' }))
    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())

    fireEvent.click(screen.getByText('✋ Take over'))

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Takeover failed: cap reached'))
  })

  // The four status endpoints default to limit=20 server-side, and the Leads
  // board has no per-column pagination — anything they don't return lands in
  // the "Other" column, so truncation looks like miscategorisation rather than
  // truncation. Production had 70 closed leads, 20 returned, and 50 showing as
  // uncategorised (2026-07-27).
  it('asks for more than the default 20 on every status column', async () => {
    mockApiGet()
    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const urls = api.get.mock.calls.map(c => c[0])
    for (const path of ['/admin-ops/leads/closed', '/admin-ops/leads/qualified', '/admin-ops/leads/rejected', '/admin-ops/conversations/active']) {
      const call = urls.find(u => u.startsWith(path))
      expect(call, `${path} was never requested`).toBeTruthy()
      const limit = Number(new URLSearchParams(call.split('?')[1] || '').get('limit'))
      expect(limit, `${path} must request more than the server default of 20`).toBeGreaterThan(20)
    }
  })

  // Phase 1 of the dashboard plan: the board must never mislead. A column that
  // is truncated, still loading, or failed to load must each look different
  // from a column that is genuinely empty — all four rendered as "None".
  describe('columns are honest about their state', () => {
    const openLeads = async () => {
      renderWithProviders(<SuperAdminDashboard />)
      await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: 'leads' }))
    }

    it('says how many exist when the server holds more than it returned', async () => {
      mockApiGet({
        '/admin-ops/overview': { data: { data: { overview: { totalLeads: 70, activeConversations: 0, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
        // 2 rows returned, 70 exist — exactly the shape of the real bug.
        '/admin-ops/leads/closed': { data: { data: { total: 70, leads: [
          { _id: 'c1', name: 'Closed One', phone: '+27820000001', workflowStatus: 'closed' },
          { _id: 'c2', name: 'Closed Two', phone: '+27820000002', workflowStatus: 'closed' },
        ] } } },
      })
      await openLeads()

      await waitFor(() => expect(screen.getByText('Closed One')).toBeInTheDocument())
      expect(screen.getByText('of 70')).toBeInTheDocument()
    })

    it('shows an error with a retry when a column fails, not "None"', async () => {
      const routes = { ...ROUTE_DEFAULTS,
        '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 0, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      }
      api.get.mockImplementation((url) => {
        const path = url.split('?')[0]
        if (path === '/admin-ops/leads/closed') return Promise.reject(new Error('boom'))
        if (path in routes) return Promise.resolve(routes[path])
        throw new Error(`Unmocked api.get call in test: ${url}`)
      })
      await openLeads()

      // useIfNotAgent sets retry: 2 per query, which overrides the test
      // client's retry: false — so the column legitimately retries with
      // backoff before surfacing an error. That is the right production
      // behaviour (a blip shouldn't flash red), so wait it out rather than
      // weakening the retry.
      await waitFor(() => expect(screen.getByText("Couldn't load this column")).toBeInTheDocument(), { timeout: 8000 })
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('states how old the figures are', async () => {
      mockApiGet({
        '/admin-ops/overview': { data: { data: { overview: { totalLeads: 4, activeConversations: 1, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      })
      renderWithProviders(<SuperAdminDashboard />)
      await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())

      // Freshness is on the Operations header, which is the default section.
      await waitFor(() => expect(screen.getByText(/Updated just now|Refreshing…/)).toBeInTheDocument())
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    })

    it('does not claim a column is empty while it is still loading', async () => {
      const routes = { ...ROUTE_DEFAULTS,
        '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 0, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      }
      api.get.mockImplementation((url) => {
        const path = url.split('?')[0]
        if (path === '/admin-ops/leads/closed') return new Promise(() => {}) // never resolves
        if (path in routes) return Promise.resolve(routes[path])
        throw new Error(`Unmocked api.get call in test: ${url}`)
      })
      await openLeads()

      await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument())
    })
  })

  // The Allocate control on the Clients tab turns an industry template into a
  // client's live bot. It renders whatever /flow-templates returns, so these
  // pin that the picker lists every template the API sends (the default mock
  // is an empty array, which hides the control entirely) and that the button
  // posts the SELECTED id — not the first one.
  describe('Allocate flow (Clients tab)', () => {
    const TEMPLATES = [
      { id: 'retail', label: 'Retail / E-commerce', demoKeywords: ['shop'] },
      { id: 'salon', label: 'Hair & Beauty Salon', demoKeywords: ['salon'] },
      { id: 'medical', label: 'Medical / Clinic', demoKeywords: ['clinic'] },
      { id: 'home', label: 'Home & Furniture', demoKeywords: ['furniture'] },
    ]
    const withClients = () => mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: { totalLeads: 1, activeConversations: 0, qualifiedLeads: 0, rejectedLeads: 0, todayLeads: 0, qualificationRate: 0 } } } },
      '/tenants': { data: { data: { tenants: [
        { _id: 'ten1', businessName: 'Glow Salon', contactEmail: 'glow@example.com', status: 'active', plan: 'starter', monthlyFee: 999, whatsappNumber: '+27650001111' },
      ] } } },
      '/admin-ops/automation/flow-templates': { data: { data: { templates: TEMPLATES } } },
    })

    const openClients = async () => {
      renderWithProviders(<SuperAdminDashboard />)
      await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: /clients/i }))
      await waitFor(() => expect(screen.getByText('Glow Salon')).toBeInTheDocument())
    }

    it('lists every template the API returns as a picker option', async () => {
      withClients()
      await openClients()

      const picker = screen.getByTitle('Industry flow template')
      expect(within(picker).getAllByRole('option')).toHaveLength(TEMPLATES.length)
      TEMPLATES.forEach(t => expect(within(picker).getByRole('option', { name: t.label })).toBeInTheDocument())
    })

    it('allocates the SELECTED template, not the first in the list', async () => {
      withClients()
      api.post.mockResolvedValue({ data: { success: true } })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.spyOn(window, 'alert').mockImplementation(() => {})
      await openClients()

      // Pick the fourth template, so a bug that posts flowTemplates[0] fails.
      fireEvent.change(screen.getByTitle('Industry flow template'), { target: { value: 'home' } })
      fireEvent.click(screen.getByText('⚡ Allocate'))

      await waitFor(() => expect(api.post).toHaveBeenCalledWith(
        '/admin-ops/automation/tenants/ten1/allocate-flow',
        { templateId: 'home' },
      ))
    })

    it('cancelling the confirm does not allocate', async () => {
      withClients()
      api.post.mockResolvedValue({ data: { success: true } })
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      await openClients()

      fireEvent.click(screen.getByText('⚡ Allocate'))

      await waitFor(() => expect(screen.getByText('⚡ Allocate')).toBeInTheDocument())
      expect(api.post).not.toHaveBeenCalled()
    })

    it('surfaces the API error message when allocation fails', async () => {
      withClients()
      api.post.mockRejectedValue({ response: { data: { message: 'Unknown flow template' } } })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await openClients()

      fireEvent.click(screen.getByText('⚡ Allocate'))

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Unknown flow template'))
    })
  })
})

// ── The action rail (Phase 2) ──────────────────────────────────────────
// The board's job is to answer "is today fine?" before you read a row. The
// rail is the only panel that answers it, which makes its failure modes
// unusually costly: a wrong "nothing outstanding" is worse than no panel.
describe('SuperAdminDashboard — action rail', () => {
  const withOwedWork = (payload) =>
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/owed-work': { data: { data: payload } },
    })

  it('lists what needs a human, most severe first, in the server’s order', async () => {
    withOwedWork({
      total: 2,
      counts: { payment_pending: 1, takeover_idle: 1 },
      items: [
        {
          id: 'payment:1', kind: 'payment_pending', severity: 'high',
          title: 'Payment not confirmed — R400',
          detail: 'Muhumo started a R400 payment 3h ago and it is still pending.',
          leadId: 'lead1', ageHours: 3,
        },
        {
          id: 'takeover:1', kind: 'takeover_idle', severity: 'medium',
          title: 'Takeover idle — bot still paused',
          detail: 'Naledi has been in a manual takeover with no activity for 30h ago.',
          leadId: 'lead2', ageHours: 30,
        },
      ],
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() =>
      expect(screen.getByText('Payment not confirmed — R400')).toBeInTheDocument())
    expect(screen.getByText('Takeover idle — bot still paused')).toBeInTheDocument()
    // Severity reads as text, not only as colour — the board gets used on a
    // phone in daylight, and colour alone does not survive that.
    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })

  it('says explicitly that nothing is outstanding when the check succeeded and found nothing', async () => {
    withOwedWork({ items: [], total: 0, counts: {} })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() =>
      expect(screen.getByText(/Nothing outstanding/)).toBeInTheDocument())
  })

  // The whole point of the rail is that silence means "you are clear". A
  // failed request must therefore never render as silence — otherwise the
  // most reassuring thing on the board is also the least trustworthy.
  it('does not pass a failed check off as an all-clear', async () => {
    const routes = {
      ...ROUTE_DEFAULTS,
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
    }
    api.get.mockImplementation((url) => {
      const path = url.split('?')[0]
      if (path === '/admin-ops/owed-work') return Promise.reject(new Error('boom'))
      return Promise.resolve(routes[path] ?? { data: { data: {} } })
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(
      () => expect(screen.getByText(/not an all-clear/)).toBeInTheDocument(),
      { timeout: 8000 }, // useIfNotAgent retries twice with backoff
    )
    expect(screen.queryByText(/Nothing outstanding/)).not.toBeInTheDocument()
  }, 10000)

  it('opens the lead behind a row', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/owed-work': { data: { data: {
        total: 1, counts: { payment_pending: 1 },
        items: [{
          id: 'payment:1', kind: 'payment_pending', severity: 'high',
          title: 'Payment not confirmed — R400',
          detail: 'Muhumo started a R400 payment 3h ago.',
          leadId: 'lead1', ageHours: 3,
        }],
      } } },
      '/admin-ops/leads/lead1/timeline': { data: { data: { lead: null, timeline: [] } } },
      // LeadDetailModal fetches timeline and takeover history in parallel.
      '/takeover/lead1/history': { data: { data: { history: [] } } },
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() =>
      expect(screen.getByText('Payment not confirmed — R400')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Payment not confirmed — R400'))

    // The row is a way INTO the conversation, not a dead notification —
    // clicking it must open that lead's thread, not just dismiss a badge.
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/admin-ops/leads/lead1/timeline'))
  })

  it('admits when it is only showing part of the list', async () => {
    withOwedWork({
      total: 12, counts: { payment_pending: 12 },
      items: [{
        id: 'payment:1', kind: 'payment_pending', severity: 'high',
        title: 'Payment not confirmed — R400', detail: 'x', leadId: null, ageHours: 3,
      }],
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('showing 1 of 12')).toBeInTheDocument())
  })
})

// ── The money panel (Phase 2) ──────────────────────────────────────────
describe('SuperAdminDashboard — money panel', () => {
  const withMoney = (money) =>
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/money': { data: { data: money } },
    })

  const MONEY = {
    currency: 'ZAR', month: '2026-07',
    collected: { thisMonth: 12500, samePeriodLastMonth: 10000, changePct: 25, count: 7, platformFees: 312 },
    unconfirmed: { amount: 400, count: 1 },
    outstanding: { invoiced: 3000, count: 2, overdueAmount: 2000, overdueCount: 1 },
    recurring: { mrr: 2850, tenants: 3 },
  }

  // en-ZA formats thousands with a NON-BREAKING space (U+00A0) — the correct
  // South African convention, and not something a plain string literal in a
  // test will match. Normalise before comparing so these assertions say what
  // a person would actually read on the screen.
  const shows = (text) =>
    screen.getByText((_, el) =>
      el?.children.length === 0 && el.textContent.replace(/ /g, ' ') === text)

  it('puts the month’s figures on the screen', async () => {
    withMoney(MONEY)
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(shows('R12 500')).toBeInTheDocument())
    expect(screen.getByText('+25% vs same point last month')).toBeInTheDocument()
    expect(shows('R2 850/mo')).toBeInTheDocument()
    expect(shows('R2 000 overdue')).toBeInTheDocument()
  })

  // Unconfirmed money is shown as its own figure and never rolled into
  // collected — the moment it joins the revenue number, the revenue number
  // stops being trustworthy.
  it('keeps unconfirmed money out of the collected figure', async () => {
    withMoney(MONEY)
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('R400')).toBeInTheDocument())
    expect(screen.getByText('1 payment not confirmed')).toBeInTheDocument()
    // 12500 + 400 would be 12900 — that number must not appear anywhere.
    expect(screen.queryByText((_, el) => el?.textContent?.replace(/ /g,' ') === 'R12 900')).not.toBeInTheDocument()
  })

  it('says nothing about change when there is no baseline to compare against', async () => {
    withMoney({ ...MONEY, collected: { ...MONEY.collected, samePeriodLastMonth: 0, changePct: null, count: 7 } })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('7 payments')).toBeInTheDocument())
    expect(screen.queryByText(/vs same point last month/)).not.toBeInTheDocument()
  })

  // A zero here is indistinguishable from a bad month, which is exactly the
  // kind of confident wrong number this whole plan exists to remove.
  it('does not render a failed load as R0', async () => {
    const routes = {
      ...ROUTE_DEFAULTS,
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
    }
    api.get.mockImplementation((url) => {
      const path = url.split('?')[0]
      if (path === '/admin-ops/money') return Promise.reject(new Error('boom'))
      return Promise.resolve(routes[path] ?? { data: { data: {} } })
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(
      () => expect(screen.getByText(/this is not R0/)).toBeInTheDocument(),
      { timeout: 8000 },
    )
  }, 10000)
})

// ── Merged lead timeline (Phase 2) ─────────────────────────────────────
// The thread used to show only what was SAID. A customer who "went quiet"
// then reads as lost interest, when the record may show they paid and the
// webhook never landed, or that a takeover parked their bot for a week.
describe('LeadDetailModal — merged timeline', () => {
  const openLeadWith = (events) =>
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Muhumo', phone: '+27821111111', workflowStatus: 'new' },
      ] } } },
      '/admin-ops/leads/lead1/timeline': { data: { data: {
        lead: { _id: 'lead1', name: 'Muhumo', phone: '+27821111111', workflowStatus: 'new' },
        timeline: [],
        events,
      } } },
      '/takeover/lead1/history': { data: { data: { history: [] } } },
    })

  const open = async () => {
    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('Muhumo')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Muhumo'))
  }

  it('shows payments and takeovers inline with the conversation', async () => {
    openLeadWith([
      { at: '2026-07-20T09:00:00Z', type: 'message_in',  title: 'Customer', detail: "I'll pay now" },
      { at: '2026-07-20T11:00:00Z', type: 'payment',     title: 'Payment started — R400', tone: 'info' },
      { at: '2026-07-20T11:00:00Z', type: 'payment',     title: 'Still unconfirmed — R400', tone: 'warn',
        detail: 'Never reached success. Either abandoned, or paid without the webhook landing.' },
      { at: '2026-07-20T12:00:00Z', type: 'takeover',    title: 'Bot paused — conversation taken over', tone: 'warn' },
      { at: '2026-07-20T14:00:00Z', type: 'message_in',  title: 'Customer', detail: 'Did it go through?' },
    ])
    await open()

    await waitFor(() => expect(screen.getByText("I'll pay now")).toBeInTheDocument())
    expect(screen.getByText('Payment started — R400')).toBeInTheDocument()
    expect(screen.getByText('Still unconfirmed — R400')).toBeInTheDocument()
    expect(screen.getByText('Bot paused — conversation taken over')).toBeInTheDocument()
    expect(screen.getByText('Did it go through?')).toBeInTheDocument()
  })

  it('falls back to the messages-only thread when the API sends no events', async () => {
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Muhumo', phone: '+27821111111', workflowStatus: 'new' },
      ] } } },
      '/admin-ops/leads/lead1/timeline': { data: { data: {
        lead: { _id: 'lead1', name: 'Muhumo', phone: '+27821111111', workflowStatus: 'new' },
        timeline: [{ direction: 'inbound', body: 'Legacy message', timestamp: '2026-07-20T09:00:00Z' }],
        // no `events` — an older backend
      } } },
      '/takeover/lead1/history': { data: { data: { history: [] } } },
    })
    await open()

    await waitFor(() => expect(screen.getByText('Legacy message')).toBeInTheDocument())
  })
})

// ── Health warnings (Phase 2) ──────────────────────────────────────────
// These are things that are silently wrong: the system keeps working while
// it is misconfigured. Nothing errors, so nothing surfaces them but this.
describe('SuperAdminDashboard — health warnings', () => {
  const withWarnings = (warnings) =>
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
      '/admin-ops/health-warnings': { data: { data: { warnings, total: warnings.length } } },
    })

  it('names what is misconfigured and why it matters', async () => {
    withWarnings([
      { kind: 'outbound_paused', severity: 'high', title: 'Outbound sending is PAUSED',
        detail: 'Messages are being queued, not sent — nothing is lost.' },
      { kind: 'agent_not_live', severity: 'medium', title: "Lonar's sales agent is in shadow mode",
        detail: 'It is enabled but not answering customers.' },
    ])
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('Needs fixing (2)')).toBeInTheDocument())
    expect(screen.getByText('Outbound sending is PAUSED')).toBeInTheDocument()
    expect(screen.getByText("Lonar's sales agent is in shadow mode")).toBeInTheDocument()
  })

  // A health panel that takes real estate to say "all good" trains you to
  // stop reading it — so a clean result is one quiet line, not a card.
  it('stays out of the way when the checks pass', async () => {
    withWarnings([])
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('Configuration checks passed')).toBeInTheDocument())
    expect(screen.queryByText(/Needs fixing/)).not.toBeInTheDocument()
  })

  it('does not pass a failed check off as a clean bill of health', async () => {
    const routes = {
      ...ROUTE_DEFAULTS,
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
      } } } },
    }
    api.get.mockImplementation((url) => {
      const path = url.split('?')[0]
      if (path === '/admin-ops/health-warnings') return Promise.reject(new Error('boom'))
      return Promise.resolve(routes[path] ?? { data: { data: {} } })
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(
      () => expect(screen.getByText(/Couldn't run the configuration checks/)).toBeInTheDocument(),
      { timeout: 8000 },
    )
    expect(screen.queryByText('Configuration checks passed')).not.toBeInTheDocument()
  }, 10000)
})

// ── Today's verdict (Phase 3) ──────────────────────────────────────────
// One line, read in two seconds, before any of the detail. Its whole value
// depends on never being wrong in the reassuring direction.
describe('SuperAdminDashboard — today’s verdict', () => {
  const base = {
    '/admin-ops/overview': { data: { data: { overview: {
      totalLeads: 1, activeConversations: 1, qualifiedLeads: 0,
      rejectedLeads: 0, todayLeads: 0, qualificationRate: 0,
    } } } },
  }

  it('says today is fine only when nothing is outstanding or misconfigured', async () => {
    mockApiGet(base)
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() => expect(screen.getByText('Today is fine')).toBeInTheDocument())
    expect(screen.getByText('Nothing needs you, and nothing is misconfigured.')).toBeInTheDocument()
  })

  it('counts what needs doing instead', async () => {
    mockApiGet({
      ...base,
      '/admin-ops/owed-work': { data: { data: {
        total: 3, counts: {},
        items: [{ id: 'p1', kind: 'payment_pending', severity: 'high', title: 'Payment not confirmed — R400', detail: 'x' }],
      } } },
      '/admin-ops/health-warnings': { data: { data: {
        warnings: [{ kind: 'no_flows', severity: 'medium', title: 'Acme has no flows at all', detail: 'y' }],
        total: 1,
      } } },
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(() =>
      expect(screen.getByText('3 things need you · 1 thing misconfigured')).toBeInTheDocument())
    expect(screen.queryByText('Today is fine')).not.toBeInTheDocument()
  })

  it('uses singular wording for a single item', async () => {
    mockApiGet({
      ...base,
      '/admin-ops/owed-work': { data: { data: {
        total: 1, counts: {},
        items: [{ id: 'p1', kind: 'payment_pending', severity: 'medium', title: 'x', detail: 'y' }],
      } } },
    })
    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('1 thing needs you')).toBeInTheDocument())
  })

  // The failure that matters most on this component. A verdict is a claim
  // about the whole system, so an incomplete picture must never produce an
  // all-clear — a reassuring summary stops you reading the detail that would
  // have corrected it.
  it('refuses to declare all-clear when a check failed to load', async () => {
    const routes = { ...ROUTE_DEFAULTS, ...base }
    api.get.mockImplementation((url) => {
      const path = url.split('?')[0]
      if (path === '/admin-ops/owed-work') return Promise.reject(new Error('boom'))
      return Promise.resolve(routes[path] ?? { data: { data: {} } })
    })
    renderWithProviders(<SuperAdminDashboard />)

    await waitFor(
      () => expect(screen.getByText("Can't tell right now")).toBeInTheDocument(),
      { timeout: 8000 },
    )
    expect(screen.queryByText('Today is fine')).not.toBeInTheDocument()
  }, 10000)
})

// ── Mobile leads board (Phase 3) ───────────────────────────────────────
// This business is run from a phone. The multi-column board is the worst
// thing on a small screen: a horizontal scroll containing columns that each
// scroll vertically, so a thumb-drag is ambiguous and most of the board is
// undiscoverable.
describe('LeadsBoard — on a phone', () => {
  const withLeads = () =>
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 2, activeConversations: 1, qualifiedLeads: 1,
        rejectedLeads: 0, todayLeads: 0, qualificationRate: 50,
      } } } },
      '/admin-ops/conversations/active': { data: { data: { leads: [
        { _id: 'lead1', name: 'Sipho', phone: '+27822222222', workflowStatus: 'new' },
      ] } } },
      '/admin-ops/leads/qualified': { data: { data: { leads: [
        { _id: 'lead2', name: 'Naledi', phone: '+27823333333', workflowStatus: 'qualified' },
      ] } } },
    })

  const openLeads = async () => {
    renderWithProviders(<SuperAdminDashboard />)
    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'leads' }))
  }

  it('shows every column side by side on a desktop', async () => {
    setViewport(false)
    withLeads()
    await openLeads()

    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())
    expect(screen.getByText('Naledi')).toBeInTheDocument() // a different column
  })

  it('shows one column at a time behind a status picker on a phone', async () => {
    setViewport(true)
    withLeads()
    await openLeads()

    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())
    // Only the selected column's leads render — no horizontal hunting.
    expect(screen.queryByText('Naledi')).not.toBeInTheDocument()
    // And the sideways-scroll instruction is gone, because there is none.
    expect(screen.queryByText(/Scroll sideways/)).not.toBeInTheDocument()
  })

  it('switches column when a status chip is tapped', async () => {
    setViewport(true)
    withLeads()
    await openLeads()

    await waitFor(() => expect(screen.getByText('Sipho')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Qualified 1/ }))

    await waitFor(() => expect(screen.getByText('Naledi')).toBeInTheDocument())
    expect(screen.queryByText('Sipho')).not.toBeInTheDocument()
  })
})
