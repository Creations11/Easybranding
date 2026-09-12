// System health — the screen for /api/admin-ops/system-health.
//
// The rule it inherits from the API: a check whose source failed reads
// "unknown", never "ok", and the page is never an all-clear while one is
// unknown. A dashboard that goes green because a check threw is the
// silence-looks-like-success failure with a reassuring colour on top.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import SystemHealthPanel from '../../src/components/SystemHealthPanel'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const section = (name, status, summary, extra = {}) => ({ name, status, summary, ...extra })

// Yesterday's real shape: ads unsettled, leads quiet, everything else fine.
const HEALTH = {
  status: 'alert',
  checkedAt: '2026-09-12T06:00:00.000Z',
  sections: [
    section('ads', 'alert', 'Ads are NOT running: UNSETTLED, R225.85 owed.', {
      accounts: [{ adAccountId: 'act_1', tenant: 'EasyBranding AI', status: 'alert', accountStatus: 'UNSETTLED', owed: 225.85, lastSpendDay: '2026-09-03', spend7d: 0, conversations7d: 0 }],
    }),
    section('quietStreams', 'alert', '1 stream gone quiet: New leads — EasyBranding AI.', {
      streams: [{ key: 'leads:t1', label: 'New leads — EasyBranding AI', since: '2026-09-09' }],
    }),
    section('fallbacks', 'ok', 'No quiet fallbacks today.', { kinds: [] }),
    section('delivery', 'ok', 'Delivering normally across 5 number(s).', { clients: [] }),
    section('ci', 'ok', 'CI passed on fed2ed7.', { lastTest: { sha: 'fed2ed7', result: 'passed' }, running: 'fed2ed7' }),
    section('agent', 'ok', 'Live. 5 of 300 turns used today.', { enabled: true, mode: 'live', turnsToday: 5, turnCap: 300 }),
    section('clients', 'warn', "Lonars' Soft Comfort cannot send yet (trial).", {
      blocked: [{ tenant: "Lonars' Soft Comfort", status: 'trial', blocker: 'cloud tenant with no phone_number_id' }],
    }),
    section('takeovers', 'ok', '4 conversation(s) taken over.', { owners: [{ owner: '+27846549578', open: 4, cap: 10 }] }),
  ],
}

describe('SystemHealthPanel', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockResolvedValue({ data: { data: HEALTH } })
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the overall verdict and every section with its sentence', async () => {
    renderWithProviders(<SystemHealthPanel />)
    expect(await screen.findByText('Needs attention')).toBeInTheDocument()
    expect(within(screen.getByTestId('section-ads')).getByText(/UNSETTLED, R225\.85 owed/)).toBeInTheDocument()
    expect(within(screen.getByTestId('section-quietStreams')).getByText(HEALTH.sections[1].summary)).toBeInTheDocument()
    expect(within(screen.getByTestId('section-agent')).getByText(HEALTH.sections[5].summary)).toBeInTheDocument()
  })

  it('puts what needs attention first, and green last', async () => {
    renderWithProviders(<SystemHealthPanel />)
    await screen.findByTestId('section-ads')
    const order = [...document.querySelectorAll('[data-testid^="section-"]')].map((el) => el.getAttribute('data-testid'))
    expect(order.slice(0, 2).sort()).toEqual(['section-ads', 'section-quietStreams'])
    expect(order[order.length - 1]).toMatch(/section-(ci|delivery|fallbacks|takeovers|agent)/)
    expect(order.indexOf('section-clients')).toBeLessThan(order.indexOf('section-ci'))
  })

  it('carries the detail that makes each line actionable', async () => {
    renderWithProviders(<SystemHealthPanel />)
    await screen.findByTestId('section-ads')
    expect(within(screen.getByTestId('section-ads')).getByText(/last spend 2026-09-03/)).toBeInTheDocument()
    expect(within(screen.getByTestId('section-clients')).getByText(/no phone_number_id/)).toBeInTheDocument()
    expect(within(screen.getByTestId('section-takeovers')).getByText(/4 of 10 slots/)).toBeInTheDocument()
  })

  // The rule the whole screen rests on.
  it('never reads as ok when a check could not run', async () => {
    api.get.mockResolvedValue({ data: { data: {
      status: 'unknown', checkedAt: HEALTH.checkedAt,
      sections: [
        section('quietStreams', 'unknown', 'Could not check: collection unavailable'),
        section('ci', 'ok', 'CI passed on fed2ed7.', { lastTest: { sha: 'fed2ed7', result: 'passed' }, running: 'fed2ed7' }),
      ],
    } } })
    renderWithProviders(<SystemHealthPanel />)

    expect(await screen.findByText('Cannot tell')).toBeInTheDocument()
    expect(screen.queryByText('All clear'), 'one unknown check must never read as an all-clear').not.toBeInTheDocument()
    expect(within(screen.getByTestId('section-quietStreams')).getByText('unknown')).toBeInTheDocument()
    // …and the unknown one is not counted among the healthy.
    expect(screen.getByText(/1 unknown · 1 ok/)).toBeInTheDocument()
  })

  it('says a failed load is not an all-clear', async () => {
    api.get.mockRejectedValue(new Error('down'))
    renderWithProviders(<SystemHealthPanel />)
    expect(await screen.findByText(/this is not an all-clear/)).toBeInTheDocument()
    expect(screen.queryByText('All clear')).not.toBeInTheDocument()
  })

  it('rechecks on demand', async () => {
    renderWithProviders(<SystemHealthPanel />)
    await screen.findByText('Needs attention')
    const before = api.get.mock.calls.length
    fireEvent.click(screen.getByText('Check now'))
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(before))
  })

  it('says all clear when everything is', async () => {
    api.get.mockResolvedValue({ data: { data: {
      status: 'ok', checkedAt: HEALTH.checkedAt,
      sections: [section('ci', 'ok', 'CI passed on fed2ed7.', { lastTest: { sha: 'fed2ed7', result: 'passed' }, running: 'fed2ed7' })],
    } } })
    renderWithProviders(<SystemHealthPanel />)
    expect(await screen.findByText('All clear')).toBeInTheDocument()
  })
})
