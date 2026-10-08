// LeadDetailModal is where every irreversible action on a lead lives —
// takeover, close, allocate, arm a follow-up, and mark as spam. All of them
// are one click, none of them had a test, and unlike the API repo there is no
// gate that fails on a skipped one.
//
// These cover the destructive paths and the guards on them, not the numbers
// the modal renders. A chart that draws a wrong figure is a bad afternoon; a
// spam button that fires on the first click removes a real customer from
// every view the owner works from.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { seedUser } from '../test-utils'
import api from '../../src/api'
import LeadDetailModal from '../../src/components/LeadDetailModal'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const LEAD_ID = 'lead-abc'

// The modal loads timeline + takeover history through Promise.allSettled, so
// both need a resolver or the component sits on its loading screen and every
// assertion below fails for the wrong reason.
const mockLead = (over = {}) => ({
  _id: LEAD_ID,
  phone: '+27820000111',
  name: 'Junk Caller',
  workflowStatus: 'capture_name',
  isActive: true,
  takenOver: false,
  spamMarkedAt: null,
  spamReason: null,
  previousWorkflowStatus: null,
  createdAt: new Date().toISOString(),
  ...over,
})

function mockLoad(leadOver = {}) {
  api.get.mockImplementation((url) => {
    if (url.includes('/timeline')) {
      return Promise.resolve({
        data: { data: { lead: mockLead(leadOver), timeline: [], events: null } },
      })
    }
    if (url.includes('/history')) {
      return Promise.resolve({ data: { data: { takeoverHistory: [] } } })
    }
    if (url.includes('/notes')) {
      return Promise.resolve({ data: { data: { notes: leadOver.__notes || [] } } })
    }
    return Promise.reject(new Error(`Unmocked api.get in test: ${url}`))
  })
}

const renderModal = async (leadOver = {}) => {
  mockLoad(leadOver)
  seedUser()
  const onUpdate = vi.fn()
  // A fresh query client each time, so no test reads another's cached lead.
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LeadDetailModal leadId={LEAD_ID} onClose={() => {}} onUpdate={onUpdate} />
    </QueryClientProvider>
  )
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
  return { onUpdate }
}

const button = (re) => screen.getByRole('button', { name: re })

describe('LeadDetailModal — the actions that destroy state', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset(); api.delete.mockReset()
    api.post.mockResolvedValue({ data: { success: true } })
    api.delete.mockResolvedValue({ data: { data: { restoredTo: 'capture_name' } } })
  })
  afterEach(() => { localStorage.clear() })

  describe('spam', () => {
    // The guard that matters most. Spam removes the lead from the leads list,
    // active conversations, the counts and the "Needs you" rail — one stray
    // click must not be able to do that.
    it('does NOT post on the first click — it asks first', async () => {
      await renderModal()

      fireEvent.click(button(/Mark as Spam/i))

      expect(api.post).not.toHaveBeenCalled()
      expect(button(/Confirm — mark as spam\?/i)).toBeInTheDocument()
    })

    it('posts to the spam endpoint on the second click', async () => {
      const { onUpdate } = await renderModal()

      fireEvent.click(button(/Mark as Spam/i))
      fireEvent.click(button(/Confirm — mark as spam\?/i))

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith(
          `/admin-ops/leads/${LEAD_ID}/spam`,
          expect.objectContaining({ reason: expect.any(String) })
        )
      )
      // The parent list has to refresh, or the lead the owner just removed
      // stays on their screen looking un-actioned.
      await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    })

    // Left armed, a later stray click lands straight on "confirm".
    it('disarms the confirm when the button loses focus', async () => {
      await renderModal()

      fireEvent.click(button(/Mark as Spam/i))
      expect(button(/Confirm — mark as spam\?/i)).toBeInTheDocument()

      fireEvent.blur(button(/Confirm — mark as spam\?/i))

      expect(button(/Mark as Spam/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Confirm — mark as spam\?/i })).not.toBeInTheDocument()
    })

    // An already-marked lead must offer the way back, not a second mark.
    it('offers the undo when the lead is already spam, and DELETEs', async () => {
      const { onUpdate } = await renderModal({
        spamMarkedAt: new Date().toISOString(),
        spamReason: 'gibberish',
      })

      expect(screen.queryByRole('button', { name: /Mark as Spam/i })).not.toBeInTheDocument()
      fireEvent.click(button(/Not spam/i))

      await waitFor(() =>
        expect(api.delete).toHaveBeenCalledWith(`/admin-ops/leads/${LEAD_ID}/spam`)
      )
      await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    })

    // A failure that looks like a success is worse than a visible failure —
    // the owner walks away believing a lead was silenced when it was not.
    it('surfaces a failed mark instead of looking successful', async () => {
      await renderModal()
      api.post.mockRejectedValueOnce({ response: { data: { message: 'Lead is already marked as spam' } } })

      fireEvent.click(button(/Mark as Spam/i))
      fireEvent.click(button(/Confirm — mark as spam\?/i))

      expect(await screen.findByText(/Lead is already marked as spam/i)).toBeInTheDocument()
    })
  })

  describe('close, takeover and resume', () => {
    // "Mark lost" (2026-10-08) is a close that records WHY, so the pipeline's
    // Lost column says what happened instead of "Closed by admin".
    it('marks a lead lost through the close endpoint, only with a reason', async () => {
      const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('  ').mockReturnValueOnce('went with someone else')
      await renderModal()

      fireEvent.click(button(/Mark lost/i))
      expect(api.post).not.toHaveBeenCalled()
      fireEvent.click(button(/Mark lost/i))

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith(
          `/admin-ops/leads/${LEAD_ID}/close`,
          { reason: 'Lost: went with someone else' }
        )
      )
      prompt.mockRestore()
    })

    it('offers Take Over on a live lead and Resume Bot on a taken-over one', async () => {
      await renderModal()
      expect(button(/Take Over/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Resume Bot/i })).not.toBeInTheDocument()
    })

    // Regression guard for a real bug fixed 2026-08-11: the timeline endpoint
    // never returned previousWorkflowStatus, so every resume silently fell
    // back to awaiting_menu and dropped the lead's actual stage.
    it('resumes at the lead’s real previous stage, not the fallback', async () => {
      await renderModal({ workflowStatus: 'taken_over', previousWorkflowStatus: 'capture_budget' })

      fireEvent.click(button(/Resume Bot/i))

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith(
          `/admin-ops/leads/${LEAD_ID}/resume`,
          { resumeAtStage: 'capture_budget' }
        )
      )
    })

    it('falls back to awaiting_menu only when there is genuinely no prior stage', async () => {
      await renderModal({ workflowStatus: 'taken_over', previousWorkflowStatus: null })

      fireEvent.click(button(/Resume Bot/i))

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith(
          `/admin-ops/leads/${LEAD_ID}/resume`,
          { resumeAtStage: 'awaiting_menu' }
        )
      )
    })
  })

  // A closed lead's action row is hidden entirely, so none of the destructive
  // buttons can be pressed on something already finished.
  it('hides the action row once the lead is closed', async () => {
    await renderModal({ workflowStatus: 'closed' })

    expect(screen.queryByRole('button', { name: /Close Lead/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mark as Spam/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Take Over/i })).not.toBeInTheDocument()
  })
})

// The lead page as the CRM's record (2026-10-08): the sales stage leads, a
// person can move it forward through the conversation stages only, and notes
// are shared through the API instead of one browser's localStorage.
describe('LeadDetailModal: the sales record', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset()
    api.post.mockResolvedValue({ data: { data: {} } })
    localStorage.clear()
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the sales stage and intent, and offers only forward conversation stages', async () => {
    await renderModal({ salesStage: 'discovery', salesIntent: 'hot', workflowStatus: 'new' })
    expect(screen.getByText('Discovery')).toBeInTheDocument()
    expect(screen.getByText(/🔥 hot/)).toBeInTheDocument()
    const move = screen.getByLabelText('Move to stage')
    const options = [...move.querySelectorAll('option')].map((o) => o.value).filter(Boolean)
    expect(options).toEqual(['qualification', 'recommendation', 'objection_handling', 'trial_close', 'commitment'])
    fireEvent.change(move, { target: { value: 'recommendation' } })
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/admin-ops/crm/leads/${LEAD_ID}/stage`, { stage: 'recommendation' }))
  })

  it('offers no stage move once the system owns the stage', async () => {
    await renderModal({ salesStage: 'payment_sent', workflowStatus: 'new' })
    expect(screen.queryByLabelText('Move to stage')).toBeNull()
  })

  it('adds shared notes, and offers to save a note left in this browser', async () => {
    localStorage.setItem('eb_lead_notes', JSON.stringify({ [LEAD_ID]: { text: 'Old local note' } }))
    await renderModal({ __notes: [{ id: 'n1', text: 'Called, wants Friday', by: 'ayanda@example.com', at: new Date().toISOString() }] })
    fireEvent.click(screen.getByRole('button', { name: /notes/i }))
    expect(await screen.findByText('Called, wants Friday')).toBeInTheDocument()
    expect(screen.getByText(/Old local note/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('New note'), { target: { value: 'Sent the R99 link' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/admin-ops/crm/leads/${LEAD_ID}/notes`, { text: 'Sent the R99 link' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save it for everyone' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/admin-ops/crm/leads/${LEAD_ID}/notes`, { text: 'Old local note' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('eb_lead_notes'))[LEAD_ID]).toBeUndefined())
  })

  it('offers Reopen on a closed lead, with the reason it was closed', async () => {
    await renderModal({ workflowStatus: 'closed', closeReason: 'Lost: no budget' })
    expect(screen.getAllByText(/Lost: no budget/).length).toBeGreaterThan(0)
    fireEvent.click(button(/Reopen/))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/admin-ops/leads/${LEAD_ID}/reopen`, {}))
  })
})
