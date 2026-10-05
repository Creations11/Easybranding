// The leads-and-conversation page at /dashboard. Untested until 2026-10-05,
// when its fetch effects became queries.
//
// Same bug as the agent page had: the timeline effect set state from whatever
// response arrived last, so opening lead A then lead B on a slow connection
// could show A's messages under B's name, with the reply box sending to B.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import Dashboard from '../../src/pages/Dashboard'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const LEADS = [
  { _id: 'a', name: 'Thandi', phone: '+27715550001', workflowStatus: 'qualified' },
  { _id: 'b', name: 'Bongani', phone: '+27715550002', workflowStatus: 'qualified' },
]

const reply = (data) => Promise.resolve({ data: { data } })
const said = (body) => ({ timeline: [{ direction: 'inbound', body, timestamp: new Date().toISOString() }] })

const wire = ({ leads = reply({ leads: LEADS }), timeline = {} } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/leads') return leads
    const m = url.match(/^\/admin-ops\/leads\/(\w+)\/timeline$/)
    if (m) return timeline[m[1]] ?? reply({ timeline: [] })
    return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
  })
}

const renderPage = () => renderWithProviders(<MemoryRouter><Dashboard /></MemoryRouter>)

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('lists the leads once they load', async () => {
    wire()
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())
    expect(screen.getByText('Bongani')).toBeInTheDocument()
  })

  it('says so when the leads cannot load', async () => {
    wire({ leads: Promise.reject(new Error('down')) })
    renderPage()
    await waitFor(() => expect(screen.getByText('Failed to load leads')).toBeInTheDocument())
  })

  it('opens the conversation of the lead that was tapped', async () => {
    wire({ timeline: { a: reply(said('Is the room still available?')) } })
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thandi'))
    await waitFor(() => expect(screen.getByText('Is the room still available?')).toBeInTheDocument())
  })

  it('never shows one lead\'s messages under another lead, however late they arrive', async () => {
    let answerA
    const slowA = new Promise((r) => { answerA = r })
    wire({
      timeline: {
        a: slowA,
        b: reply(said('Bongani here, can I view on Saturday?')),
      },
    })
    renderPage()
    await waitFor(() => expect(screen.getByText('Thandi')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thandi'))
    fireEvent.click(screen.getByText('Bongani'))
    await waitFor(() => expect(screen.getByText('Bongani here, can I view on Saturday?')).toBeInTheDocument())

    answerA({ data: { data: said('Thandi here, is it furnished?') } })
    await new Promise((r) => setTimeout(r, 0))

    expect(screen.queryByText('Thandi here, is it furnished?')).not.toBeInTheDocument()
    expect(screen.getByText('Bongani here, can I view on Saturday?')).toBeInTheDocument()
  })
})
