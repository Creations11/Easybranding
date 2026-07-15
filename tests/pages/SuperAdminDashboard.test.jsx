import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import SuperAdminDashboard from '../../src/pages/SuperAdminDashboard'

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
  '/tenants': { data: { data: { tenants: [] } } },
  '/tenants/stats': { data: { data: { stats: null } } },
  '/users': { data: { data: { users: [] } } },
  '/users/pending': { data: { data: { users: [] } } },
  '/admin-ops/agents': { data: { data: { agents: [] } } },
}

const mockApiGet = (overrides = {}) => {
  const routes = { ...ROUTE_DEFAULTS, ...overrides }
  api.get.mockImplementation((url) => {
    if (url in routes) return Promise.resolve(routes[url])
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
})
