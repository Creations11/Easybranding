// The WhatsApp API inbox (components/inbox/), which replaced the Chat tab on
// the Super Admin dashboard on 2026-10-21. It is the screen that sends
// messages to real customers, so these cover the rules that are not
// cosmetic:
//   - you cannot type into a conversation the assistant still owns;
//   - "waiting on us" comes first, the most recent first (who a reply
//     still reaches freely);
//   - an open conversation keeps itself fresh, which the Chat tab never did;
//   - a platform login cannot "message everyone" until a client is chosen,
//     and when it can, the send names that client to the API.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as rtlRender, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { seedUser } from '../test-utils'
import api from '../../src/api'
import InboxView from '../../src/components/inbox/InboxView'
import { THREAD_REFRESH_MS } from '../../src/hooks/useInbox'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const setViewport = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: mobile ? q.includes('max-width') : false,
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString()
const lead = (id, extra) => ({
  id, name: null, phone: '+2782000000' + id.slice(-1), tenantId: 't1', business: 'Venbus', bucket: 'talking',
  stage: 'discovery', intent: null, waitingSince: null, lastActivityAt: hoursAgo(1), lastText: 'hello',
  messageCount: 3, followUpAt: null, takenOver: false, optedOut: false, notesCount: 0, createdAt: hoursAgo(48), ...extra,
})
const LEADS = [
  lead('l1', { name: 'Recent Waiter', waitingSince: hoursAgo(1), lastActivityAt: hoursAgo(1) }),
  lead('l2', { name: 'Long Waiter', waitingSince: hoursAgo(9), lastActivityAt: hoursAgo(9) }),
  lead('l3', { name: 'Taken Over', takenOver: true, lastActivityAt: hoursAgo(2) }),
  lead('l4', { name: 'Gone Quiet', bucket: 'lost', lastActivityAt: hoursAgo(30) }),
]

const thread = (status) => ({
  lead: { _id: 'l2', name: 'Long Waiter', phone: '+27820000002', workflowStatus: status, inWindow: true },
  timeline: [{ direction: 'inbound', body: 'Are you open on Saturday?', timestamp: hoursAgo(9) }],
})

let threadStatus
const wire = () => {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/admin-ops/crm/leads/') && url.endsWith('/notes')) return Promise.resolve({ data: { data: { notes: [] } } })
    if (url.startsWith('/admin-ops/crm/leads')) {
      return Promise.resolve({ data: { data: { leads: LEADS, buckets: [], summary: {} } } })
    }
    if (url.includes('/timeline')) return Promise.resolve({ data: { data: thread(threadStatus) } })
    return Promise.reject(new Error(`Unmocked api.get: ${url}`))
  })
}

const render = (props = {}) => rtlRender(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <InboxView scope="" showBusiness onOpenRecord={() => {}} {...props} />
  </QueryClientProvider>,
)

const names = () => screen.getAllByRole('button').map((b) => b.textContent).filter((t) => /Waiter|Taken Over|Gone Quiet/.test(t))

beforeEach(() => {
  seedUser()
  setViewport(false)
  vi.clearAllMocks()
  threadStatus = 'active'
  Element.prototype.scrollIntoView = vi.fn()
  wire()
})
afterEach(() => { localStorage.clear(); vi.useRealTimers() })

describe('the conversation list', () => {
  it('opens on "Waiting on us", the most recent first', async () => {
    render()
    await screen.findByText('Long Waiter')
    expect(screen.getByRole('tab', { name: /Waiting on us/ })).toHaveAttribute('aria-selected', 'true')
    const shown = names()
    expect(shown).toHaveLength(2)
    expect(shown[0]).toMatch(/Recent Waiter/)
    expect(shown[1]).toMatch(/Long Waiter/)
  })

  it('lists conversations the old Chat tab could not reach', async () => {
    render()
    await screen.findByText('Long Waiter')
    fireEvent.click(screen.getByRole('tab', { name: /Taken over/ }))
    expect(screen.getByText('Taken Over')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Closed/ }))
    expect(screen.getByText('Gone Quiet')).toBeInTheDocument()
  })

  it('shows the number under a name, and the client when viewing all clients', async () => {
    render()
    const row = (await screen.findByText('Long Waiter')).closest('button')
    expect(within(row).getByText('+27820000002')).toBeInTheDocument()
    expect(within(row).getByText('Venbus')).toBeInTheDocument()
  })
})

describe('a conversation', () => {
  it('has no message box while the assistant owns it: Take over first', async () => {
    render()
    fireEvent.click(await screen.findByText('Long Waiter'))
    expect(await screen.findByText('Are you open on Saturday?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Take over to reply/ })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument()
  })

  it('sends once taken over, through the same guarded endpoint', async () => {
    threadStatus = 'taken_over'
    api.post.mockResolvedValue({ data: { data: {} } })
    render()
    fireEvent.click(await screen.findByText('Long Waiter'))
    const box = await screen.findByRole('textbox', { name: 'Message' })
    fireEvent.change(box, { target: { value: 'Yes, 8 to 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/l2/message', { message: 'Yes, 8 to 1' }))
  })

  it('asks for new messages on its own while it is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render()
    fireEvent.click(await screen.findByText('Long Waiter'))
    await screen.findByText('Are you open on Saturday?')
    const asked = () => api.get.mock.calls.filter(([u]) => u === '/admin-ops/leads/l2/timeline').length
    const before = asked()
    await vi.advanceTimersByTimeAsync(THREAD_REFRESH_MS + 100)
    await waitFor(() => expect(asked()).toBeGreaterThan(before))
  })

  it('puts a saved reply into the box, never straight to the customer', async () => {
    threadStatus = 'taken_over'
    localStorage.setItem('wabos.savedReplies', JSON.stringify(['We open at 8.']))
    render()
    fireEvent.click(await screen.findByText('Long Waiter'))
    fireEvent.click(await screen.findByRole('button', { name: 'We open at 8.' }))
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('We open at 8.')
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('message everyone', () => {
  it('waits for a client to be chosen on a platform login', async () => {
    render()
    await screen.findByText('Long Waiter')
    expect(screen.queryByRole('button', { name: /Message everyone/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Pick a client in Viewing/)).toBeInTheDocument()
  })

  it('names the chosen client to the API', async () => {
    api.post.mockResolvedValue({ data: { willReach: 0, audience: { total: 0, inWindow: 0, outOfWindow: 0 } } })
    render({ scope: 't1', businessName: 'Venbus' })
    fireEvent.click(await screen.findByRole('button', { name: /Message everyone at Venbus/ }))
    fireEvent.change(screen.getByPlaceholderText('What do you want to tell them?'), { target: { value: 'Closed Monday' } })
    fireEvent.click(screen.getByRole('button', { name: 'Who gets this?' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/broadcast?tenantId=t1', { message: 'Closed Monday', dryRun: true }))
  })
})
