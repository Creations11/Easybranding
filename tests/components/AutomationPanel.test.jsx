// The sales agent pauses itself (a day at a time when the AI account is out
// of credit). Until 2026-10-08 the panel showed PAUSED with no way to lift
// it, and the WhatsApp command the alert named did not exist.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import AutomationPanel from '../../src/components/AutomationPanel'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const agent = (over = {}) => ({
  tenantId: 't1', businessName: 'EasyBranding AI', mode: 'live', pausedUntil: null,
  pipeline: { hot: 0, warm: 0, cool: 0, lost: 0 }, catalogSize: 3, consecutiveFailures: 0,
  bookingUrl: null, reengagementTemplateSid: null, recentShadowDrafts: [], ...over,
})

const serve = (agents) => api.get.mockImplementation((url) => Promise.resolve({
  data: { data: url.endsWith('/agents') ? agents : [] },
}))

describe('AutomationPanel: resuming a paused agent', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => vi.restoreAllMocks())

  it('offers Resume only while paused, and confirms first', async () => {
    serve([agent({ pausedUntil: new Date(Date.now() + 86_400_000).toISOString() })])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.post.mockResolvedValue({ data: { success: true } })
    renderWithProviders(<AutomationPanel />)

    fireEvent.click(await screen.findByText('Resume'))
    expect(api.post).not.toHaveBeenCalled()
    expect(confirm.mock.calls[0][0]).toMatch(/top up first/)
    fireEvent.click(screen.getByText('Resume'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/automation/agents/t1/resume'))
  })

  it('shows no Resume for a live agent', async () => {
    serve([agent()])
    renderWithProviders(<AutomationPanel />)
    expect(await screen.findByText('LIVE')).toBeInTheDocument()
    expect(screen.queryByText('Resume')).toBeNull()
  })
})
