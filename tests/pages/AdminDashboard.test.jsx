import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { seedUser } from '../test-utils'
import api from '../../src/api'
import AdminDashboard from '../../src/pages/AdminDashboard'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

// AdminDashboard fetches all 14 of these in one Promise.all (loadData,
// src/pages/AdminDashboard.jsx) — unlike SuperAdminDashboard's React
// Query hooks, there's no per-endpoint enable/disable, so every route
// needs a default resolver or Promise.all rejects with "undefined is not
// a function" style noise instead of the intended test scenario.
const ROUTE_DEFAULTS = {
  '/admin-ops/overview': { data: { data: { overview: null } } },
  '/admin-ops/conversations/active': { data: { data: { leads: [] } } },
  '/admin-ops/leads/qualified': { data: { data: { leads: [] } } },
  '/admin-ops/leads/rejected': { data: { data: { leads: [] } } },
  '/admin-ops/leads/closed': { data: { data: { leads: [] } } },
  '/admin-ops/alerts': { data: { data: { alerts: [] } } },
  '/admin-ops/agents': { data: { data: { agents: [] } } },
  '/tenants': { data: { data: { tenants: [] } } },
  '/tenants/stats': { data: { data: { stats: null } } },
  '/users/pending': { data: { data: { users: [] } } },
  '/users': { data: { data: { users: [] } } },
  '/admin-ops/stages': { data: { data: { stages: [] } } },
  '/admin-ops/messages/recent': { data: { data: { messages: [] } } },
  '/admin-ops/viewings': { data: { data: { viewings: [] } } },
}

const mockApiGet = (overrides = {}) => {
  const routes = { ...ROUTE_DEFAULTS, ...overrides }
  api.get.mockImplementation((url) => {
    if (url in routes) return Promise.resolve(routes[url])
    return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
  })
}

beforeEach(() => {
  localStorage.clear()
  api.get.mockReset()
  api.post.mockReset()
})

describe('AdminDashboard', () => {
  it('shows the loading state before the initial Promise.all resolves', () => {
    seedUser({ role: 'admin' })
    api.get.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<AdminDashboard />)
    expect(screen.getByText('Loading Admin Operations Center...')).toBeInTheDocument()
  })

  // One failing call must NOT blank the dashboard. It used to: loadData ran
  // Promise.all, so a single rejection replaced the whole page with an error —
  // which is how the deliberate 403 on /tenants/stats took every client's
  // dashboard down (2026-08-07). The failure still has to be visible (an empty
  // panel otherwise reads as "no data"), so it surfaces as a banner while the
  // panels that loaded keep rendering.
  it('surfaces a failed call as a banner without destroying the page', async () => {
    seedUser({ role: 'admin' })
    mockApiGet({
      '/admin-ops/agents': Promise.reject({ response: { data: { message: 'Agents endpoint down' } } }),
    })

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getByText(/Agents endpoint down/)).toBeInTheDocument())
    // The dashboard itself still rendered — this is the regression guard.
    expect(screen.getByRole('button', { name: /^Leads/ })).toBeInTheDocument()
  })

  it('blanks the page only when EVERY call fails (dead API / expired token)', async () => {
    seedUser({ role: 'admin' })
    api.get.mockImplementation(() =>
      Promise.reject({ response: { data: { message: 'Session expired' } } }))

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getByText('Session expired')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /^Leads/ })).not.toBeInTheDocument()
  })

  // A tenant admin must never request platform-wide stats: /tenants/stats is
  // super_admin-only and its 403 was the original outage.
  it('does not request /tenants/stats for a plain admin, but does for super_admin', async () => {
    seedUser({ role: 'admin' })
    mockApiGet()
    render(<AdminDashboard />)
    await waitFor(() => expect(screen.queryByText('Loading Admin Operations Center...')).not.toBeInTheDocument())
    expect(api.get).not.toHaveBeenCalledWith('/tenants/stats')

    api.get.mockReset()
    localStorage.clear()
    seedUser({ role: 'super_admin' })
    mockApiGet()
    render(<AdminDashboard />)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/tenants/stats'))
  })

  it('renders Overview stats once all 14 calls resolve', async () => {
    seedUser({ role: 'admin' })
    mockApiGet({
      '/admin-ops/overview': { data: { data: { overview: {
        totalLeads: 7, activeConversations: 2, qualifiedLeads: 3,
        rejectedLeads: 1, todayLeads: 0, qualificationRate: 42,
      } } } },
    })

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getByText('Total Leads')).toBeInTheDocument())
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows the super_admin-only tabs (Clients/Users/Platform) only for that role', async () => {
    seedUser({ role: 'super_admin' })
    mockApiGet()

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.queryByText('Loading Admin Operations Center...')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Clients' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Platform' })).toBeInTheDocument()
  })

  it('a plain admin sees Users but not Clients/Platform', async () => {
    seedUser({ role: 'admin' })
    mockApiGet()

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.queryByText('Loading Admin Operations Center...')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clients' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Platform' })).not.toBeInTheDocument()
  })

  it('clicking Reopen on a closed lead calls the reopen endpoint and reloads all data', async () => {
    seedUser({ role: 'admin' })
    mockApiGet({
      '/admin-ops/leads/closed': { data: { data: { leads: [
        { _id: 'lead1', name: 'Closed Lead', phone: '+27823333333', closeReason: 'Manually closed' },
      ] } } },
    })
    api.post.mockResolvedValue({ data: { success: true } })

    render(<AdminDashboard />)
    await waitFor(() => expect(screen.queryByText('Loading Admin Operations Center...')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^Leads/ }))
    await waitFor(() => expect(screen.getByText('Closed Lead')).toBeInTheDocument())

    const getCallsBeforeReopen = api.get.mock.calls.length
    fireEvent.click(screen.getByText('🔓 Reopen'))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/lead1/reopen'))
    // handleReopen calls loadData() again on success — a full second
    // 14-call Promise.all round, unlike SuperAdminDashboard's targeted
    // refetch()/invalidateQueries.
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(getCallsBeforeReopen))
  })
})
