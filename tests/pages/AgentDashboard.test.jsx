// The agent's page: their leads, and the conversation with whichever one they
// open. Untested until 2026-10-05, when its two mount effects became queries.
//
// The test that matters most is the slow-answer one. The old conversation
// effect set state from whatever response arrived last, so tapping lead A and
// then lead B on a slow connection could put A's messages under B's name, and
// an agent typing into that chat would be answering the wrong customer. Keyed
// by lead, a late answer for A can only ever land in A's cache entry.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import AgentDashboard from '../../src/pages/AgentDashboard'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const AGENT = { role: 'agent', fullName: 'Sipho Agent', email: 'sipho@test.co.za' }

const LEADS = [
  { _id: 'a', name: 'Thandi', phone: '+27715550001', workflowStatus: 'qualified' },
  { _id: 'b', name: 'Bongani', phone: '+27715550002', workflowStatus: 'qualified' },
]

const reply = (data) => Promise.resolve({ data: { data } })

const wire = ({ conversation = {} } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/agent/overview') return reply({ overview: null })
    if (url === '/agent/leads') return reply({ leads: LEADS })
    if (url === '/agent/viewings') return reply({ viewings: [] })
    if (url === '/agent/takeover-queue') return reply(null)
    const m = url.match(/^\/agent\/leads\/(\w+)\/conversation$/)
    if (m) return conversation[m[1]] ?? reply({ timeline: [] })
    return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
  })
}

const renderPage = () => renderWithProviders(
  <MemoryRouter><AgentDashboard /></MemoryRouter>,
  { user: AGENT },
)

const said = (body) => ({ timeline: [{ direction: 'inbound', body }] })

describe('AgentDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('lists the agent\'s leads once they load', async () => {
    wire()
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())
    expect(screen.getByText('Bongani')).toBeInTheDocument()
  })

  // An agent is not an admin, and /admin-ops/alerts 403s for them. Asking for
  // it once took the whole page down (2026-08-07); it is not asked for at all.
  it('does not ask an agent for admin alerts', async () => {
    wire()
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())
    expect(api.get).not.toHaveBeenCalledWith('/admin-ops/alerts')
  })

  it('opens the conversation of the lead that was tapped', async () => {
    wire({ conversation: { a: reply(said('Is the room still available?')) } })
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thandi'))
    await waitFor(() => expect(screen.getByText('Is the room still available?')).toBeInTheDocument())
  })

  it('never shows one lead\'s messages under another lead, however late they arrive', async () => {
    let answerA
    const slowA = new Promise((r) => { answerA = r })
    wire({
      conversation: {
        a: slowA,
        b: reply(said('Bongani here, can I view on Saturday?')),
      },
    })
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())

    // Tap A, then B before A has answered.
    fireEvent.click(screen.getByText('Thandi'))
    fireEvent.click(screen.getByText('Bongani'))
    await waitFor(() => expect(screen.getByText('Bongani here, can I view on Saturday?')).toBeInTheDocument())

    // A finally answers. B's chat must not change.
    answerA({ data: { data: said('Thandi here, is it furnished?') } })
    await new Promise((r) => setTimeout(r, 0))

    expect(screen.queryByText('Thandi here, is it furnished?')).not.toBeInTheDocument()
    expect(screen.getByText('Bongani here, can I view on Saturday?')).toBeInTheDocument()
  })
})
