// What the client owners' chat (ChatTab) promised, carried over to the inbox
// that replaced it on 2026-10-21 (Ayanda: "give them the new inbox"). Each
// group was written for a real complaint, so each still has to hold:
//   - two voices answering one customer: no composer until the takeover is real;
//   - a send that fails gives the words back;
//   - photos, voice notes and documents show as themselves (Baltmore's proof
//     of payment arrived as three blank bubbles once);
//   - the name AND the number, the number ready to dial (Baltmore);
//   - Message everyone asks who it reaches before it can send;
//   - outside 24 hours the composer stays and says what will happen;
//   - on a phone, the thread takes the screen and a back arrow returns.
// The tests for the inbox's own behaviour are in Inbox.test.jsx.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as rtlRender, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { seedUser } from '../test-utils'
import api from '../../src/api'
import InboxView from '../../src/components/inbox/InboxView'

// `defaults` included because the real axios instance has it and Media reads
// baseURL off it.
vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

// useMediaQuery reads matchMedia, which jsdom does not implement.
const setViewport = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: mobile ? q.includes('max-width') : false,
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

const now = new Date().toISOString()
const lead = (id, extra) => ({
  id, name: null, phone: '', tenantId: 't1', business: 'SendUs', bucket: 'talking', stage: 'discovery',
  intent: null, waitingSince: null, lastActivityAt: now, lastText: '', messageCount: 2, followUpAt: null,
  takenOver: false, optedOut: false, notesCount: 0, createdAt: now, ...extra,
})
// Nobody waiting, so the inbox opens on "All open" and both are listed.
const LEADS = [
  lead('l1', { name: 'Prisca Ndlovu', phone: '+27618076325', lastText: 'Im selling clothing' }),
  lead('l2', { phone: '+27737299929', lastText: 'Thanks Stanley' }),
]

let thread
const timeline = (status, extra = {}) => ({
  lead: { _id: 'l1', name: 'Prisca Ndlovu', phone: '+27618076325', workflowStatus: status, ...extra },
  timeline: [
    { direction: 'inbound', body: 'Im selling clothing', timestamp: now },
    { direction: 'outbound', body: 'Got it', timestamp: now },
  ],
})

const wire = (leads = LEADS) => {
  api.get.mockImplementation((url) => {
    if (url.endsWith('/notes')) return Promise.resolve({ data: { data: { notes: [] } } })
    if (url.startsWith('/admin-ops/crm/leads')) return Promise.resolve({ data: { data: { leads, buckets: [], summary: {} } } })
    if (url.includes('/timeline')) return Promise.resolve({ data: { data: thread } })
    return Promise.reject(new Error(`Unmocked api.get: ${url}`))
  })
}

// A client owner's inbox: their own business, no client picker.
const render = () => rtlRender(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <InboxView scope="" showBusiness={false} onOpenRecord={() => {}} />
  </QueryClientProvider>,
)

const openPrisca = async () => {
  render()
  fireEvent.click(await screen.findByText('Prisca Ndlovu'))
}
const composer = () => screen.queryByRole('textbox', { name: 'Message' })
const send = (text) => {
  const box = composer()
  fireEvent.change(box, { target: { value: text } })
  fireEvent.keyDown(box, { key: 'Enter' })
}

beforeEach(() => {
  seedUser({ role: 'admin' })
  setViewport(false)
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
  thread = timeline('taken_over')
  wire()
})
afterEach(() => { localStorage.clear() })

describe('the rule that is not cosmetic', () => {
  // Two voices answering one customer is the bug class this codebase keeps
  // hitting. The composer must not exist until the takeover is real.
  it('offers Take Over instead of a composer while the bot owns the thread', async () => {
    thread = timeline('qualified')
    await openPrisca()
    expect(await screen.findByText(/take over to reply/i)).toBeInTheDocument()
    expect(composer()).not.toBeInTheDocument()
  })

  it('shows the composer once the conversation is taken over', async () => {
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    expect(screen.queryByText(/take over to reply/i)).not.toBeInTheDocument()
  })

  it('refuses to send on a closed conversation', async () => {
    thread = timeline('closed')
    await openPrisca()
    expect(await screen.findByText(/conversation is closed/i)).toBeInTheDocument()
    expect(composer()).not.toBeInTheDocument()
  })
})

describe('sending', () => {
  it('posts to the lead message endpoint', async () => {
    api.post.mockResolvedValue({ data: {} })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('We can do clothing too')
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/l1/message', { message: 'We can do clothing too' }))
  })

  // Losing what someone typed on a phone signal is the worst possible
  // outcome of a failed send.
  it('gives the text back when the send fails', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'WhatsApp down' } } })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('important reply')
    expect(await screen.findByText(/whatsapp down/i)).toBeInTheDocument()
    expect(composer()).toHaveValue('important reply')
  })

  it('does not send an empty message', async () => {
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('   ')
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('media in the thread', () => {
  // Caption-less media is stored with a stand-in body, because
  // Lead.messages.body is required and an empty string loses the whole write.
  const placeholderFor = (t) =>
    /image/.test(t) ? '📷 Photo'
    : /audio/.test(t) ? '🎤 Voice note'
    : /video/.test(t) ? '🎥 Video'
    : '📎 Document'
  const withMedia = (contentType, body = null) => {
    thread = {
      lead: { _id: 'l1', name: 'Prisca Ndlovu', phone: '+27618076325', workflowStatus: 'taken_over' },
      timeline: [{
        direction: 'inbound', body: body ?? placeholderFor(contentType), timestamp: now,
        mediaContentType: contentType, mediaPath: '/admin-ops/leads/l1/media/1',
      }],
    }
  }

  it('renders a photo as an image, not an empty bubble', async () => {
    withMedia('image/jpeg')
    await openPrisca()
    const img = await screen.findByRole('img', { name: /photo/i })
    expect(img.getAttribute('src')).toContain('/admin-ops/leads/l1/media/1')
  })

  it('gives a voice note a player', async () => {
    withMedia('audio/ogg')
    await openPrisca()
    await waitFor(() => expect(document.querySelector('audio')?.getAttribute('src')).toContain('/media/1'))
  })

  it('offers a document as a link rather than trying to preview it', async () => {
    withMedia('application/pdf')
    await openPrisca()
    expect(await screen.findByRole('link', { name: /document/i })).toBeInTheDocument()
  })

  // Never the protected provider URL: it 401s in a browser.
  it('never points at Twilio directly', async () => {
    withMedia('image/jpeg')
    await openPrisca()
    expect((await screen.findByRole('img', { name: /photo/i })).getAttribute('src')).not.toMatch(/api\.twilio\.com/)
  })

  it('keeps the caption alongside the photo when there is one', async () => {
    withMedia('image/jpeg', 'here is the proof')
    await openPrisca()
    expect(await screen.findByText('here is the proof')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /photo/i })).toBeInTheDocument()
  })

  // WhatsApp does not print the word "Photo" under a photo.
  it('does not repeat the stand-in body under the attachment', async () => {
    withMedia('image/jpeg')
    await openPrisca()
    await screen.findByRole('img', { name: /photo/i })
    expect(screen.queryByText('📷 Photo')).not.toBeInTheDocument()
  })

  it('still shows a body that only looks like a caption', async () => {
    withMedia('image/jpeg', 'Photo of the invoice')
    await openPrisca()
    expect(await screen.findByText('Photo of the invoice')).toBeInTheDocument()
  })

  it('labels an attachment in the conversation list', async () => {
    wire([lead('l1', { name: 'Prisca Ndlovu', phone: '+27618076325', lastText: '🎤 Voice note' })])
    render()
    expect(await screen.findByText(/voice note/i)).toBeInTheDocument()
  })
})

// Baltmore: "why doesn't the chat show the name and the number, we have both."
describe('name and number together', () => {
  it('shows both in the conversation list', async () => {
    render()
    expect(await screen.findByText('Prisca Ndlovu')).toBeInTheDocument()
    expect(screen.getByText('+27618076325')).toBeInTheDocument()
  })

  // The fallback row already IS the number. Printing it twice reads as a bug.
  it('does not repeat the number when it is standing in for the name', async () => {
    render()
    await screen.findByText('Prisca Ndlovu')
    expect(screen.getAllByText('+27737299929')).toHaveLength(1)
  })

  it('shows the number in the thread header, ready to dial', async () => {
    await openPrisca()
    const link = await screen.findByRole('link', { name: '+27618076325' })
    expect(link).toHaveAttribute('href', 'tel:+27618076325')
  })

  it('still says who is answering, alongside the number', async () => {
    thread = timeline('qualified')
    await openPrisca()
    const link = await screen.findByRole('link', { name: '+27618076325' })
    expect(link.closest('p')).toHaveTextContent(/assistant is answering/i)
  })

  it('does not show a business name on an owner\'s own inbox', async () => {
    render()
    const row = (await screen.findByText('Prisca Ndlovu')).closest('button')
    expect(within(row).queryByText('SendUs')).not.toBeInTheDocument()
  })
})

// Two steps on purpose: WhatsApp discards a freeform message to anyone who
// has not written in 24 hours AND reports it as sent. Every one of Baltmore's
// six customers was out of window when this was built.
describe('message everyone', () => {
  const openPanel = async () => {
    render()
    fireEvent.click(await screen.findByRole('button', { name: /message everyone/i }))
    fireEvent.change(screen.getByPlaceholderText('What do you want to tell them?'), { target: { value: 'We are closed Monday' } })
  }
  const preview = (willReach, total = 6) => ({ data: { willReach, audience: { total, inWindow: willReach, outOfWindow: total - willReach } } })

  it('is there for an owner, for their own customers', async () => {
    render()
    expect(await screen.findByRole('button', { name: /message everyone/i })).toBeInTheDocument()
  })

  it('runs a dry run first and never sends on the first click', async () => {
    api.post.mockResolvedValue(preview(2))
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Who gets this?' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/broadcast', { message: 'We are closed Monday', dryRun: true }))
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('shows the real reach, not the audience size', async () => {
    api.post.mockResolvedValue(preview(2))
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Who gets this?' }))
    expect(await screen.findByText('Reaches 2 of 6')).toBeInTheDocument()
  })

  it('offers no send button when it would reach nobody', async () => {
    api.post.mockResolvedValue(preview(0))
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Who gets this?' }))
    await screen.findByText('Reaches 0 of 6')
    expect(screen.queryByRole('button', { name: /send to/i })).not.toBeInTheDocument()
  })

  it('sends for real only on the second click', async () => {
    api.post.mockResolvedValueOnce(preview(2)).mockResolvedValueOnce({ data: { message: 'Sent to 2.' } })
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Who gets this?' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Send to 2' }))
    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/admin-ops/broadcast', { message: 'We are closed Monday' }))
    expect(await screen.findByText('Sent to 2.')).toBeInTheDocument()
  })
})

describe('reopening a chat that fell outside the window', () => {
  // The composer STAYS. The server sends a re-engagement template and holds
  // the message until they reply, because a template does not reopen the
  // window, only their answer does.
  it('keeps the composer and explains what will happen', async () => {
    thread = timeline('taken_over', { inWindow: false })
    await openPrisca()
    expect(await screen.findByText(/goes the moment they reply/i)).toBeInTheDocument()
    expect(composer()).toBeInTheDocument()
  })

  it('sends through the normal message endpoint anyway', async () => {
    thread = timeline('taken_over', { inWindow: false })
    api.post.mockResolvedValue({ data: { data: { held: true }, message: 'Held.' } })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('Your quote is ready')
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/l1/message', { message: 'Your quote is ready' }))
  })

  // "Sent" would be a lie: it is waiting.
  it('says the message is waiting rather than sent', async () => {
    thread = timeline('taken_over', { inWindow: false })
    api.post.mockResolvedValue({ data: { data: { held: true, openerSent: true }, message: 'yours goes the moment they answer' } })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('Your quote is ready')
    expect(await screen.findByText(/goes the moment they answer/i)).toBeInTheDocument()
  })

  it('reports a refusal instead of claiming it worked', async () => {
    thread = timeline('taken_over', { inWindow: false })
    api.post.mockResolvedValue({ data: { data: { held: false, reason: 'resting' }, message: 'Prisca is marked do-not-disturb — nothing was sent.' } })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    send('hello')
    expect(await screen.findByText(/do-not-disturb/i)).toBeInTheDocument()
  })

  it('shows no out-of-window note when the window is open', async () => {
    thread = timeline('taken_over', { inWindow: true })
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    expect(screen.queryByText(/goes the moment they reply/i)).not.toBeInTheDocument()
  })

  // Older responses have no inWindow field at all. Hiding the composer on a
  // missing value would break every thread on a stale deploy.
  it('does not hide the composer when the API says nothing about the window', async () => {
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
  })
})

describe('on a phone', () => {
  beforeEach(() => setViewport(true))

  it('shows the list first, not an empty thread pane', async () => {
    render()
    expect(await screen.findByText('Prisca Ndlovu')).toBeInTheDocument()
    expect(screen.queryByText(/pick a conversation/i)).not.toBeInTheDocument()
  })

  it('opens the thread full screen, with a way back to the list', async () => {
    await openPrisca()
    const back = await screen.findByRole('button', { name: /back to conversations/i })
    expect(back.closest('.fixed')).toBeTruthy()
    fireEvent.click(back)
    await waitFor(() => expect(screen.queryByRole('button', { name: /back to conversations/i })).not.toBeInTheDocument())
  })

  // 16px or iOS zooms the page on focus and strands the user.
  it('uses a 16px composer so iOS does not zoom', async () => {
    await openPrisca()
    await waitFor(() => expect(composer()).toBeInTheDocument())
    expect(composer().className).toMatch(/(^|\s)text-base(\s|$)/)
  })
})
