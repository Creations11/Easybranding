// The chat tab is what Baltmore asked for after saying the product did not
// let him talk to his clients. It is also the only screen in the dashboard
// that sends a message to a real customer.
//
// These cover the rule that is not cosmetic — you cannot type into a
// conversation the assistant still owns — and the phone behaviour, since
// "fully phone compatible" was the requirement, not a nice-to-have.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { seedUser } from '../test-utils'
import api from '../../src/api'
import ChatTab from '../../src/components/ChatTab'

// `defaults` included because the real axios instance has it and Media reads
// baseURL off it — a mock missing it renders nothing and the failure looks
// like a broken component rather than a broken fixture.
vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

// useMediaQuery reads matchMedia, which jsdom does not implement.
const setViewport = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: mobile && q.includes('max-width'),
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

const CONVOS = [
  { _id: 'l1', name: 'Prisca Ndlovu', phone: '+27618076325', lastMessageAt: new Date().toISOString(),
    lastMessage: { direction: 'inbound', body: 'Im selling clothing' }, awaitingReply: true },
  { _id: 'l2', name: 'Unknown', phone: '+27737299929', lastMessageAt: new Date().toISOString(),
    lastMessage: { direction: 'outbound', body: 'Thanks Stanley' }, awaitingReply: false },
]

const timeline = (status) => ({
  data: { data: {
    lead: { _id: 'l1', name: 'Prisca Ndlovu', phone: '+27618076325', workflowStatus: status },
    timeline: [
      { direction: 'inbound',  body: 'Im selling clothing', timestamp: new Date().toISOString() },
      { direction: 'outbound', body: 'Got it',              timestamp: new Date().toISOString() },
    ],
  } },
})

beforeEach(() => {
  seedUser()
  setViewport(false)
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { localStorage.clear() })

describe('the conversation list', () => {
  it('lists conversations with a preview', () => {
    render(<ChatTab conversations={CONVOS} />)
    expect(screen.getByText('Prisca Ndlovu')).toBeInTheDocument()
    expect(screen.getByText(/Im selling clothing/)).toBeInTheDocument()
  })

  it('falls back to the number when there is no name', () => {
    render(<ChatTab conversations={CONVOS} />)
    expect(screen.getByText('+27737299929')).toBeInTheDocument()
  })

  it('filters by name or number', () => {
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: '7372' } })
    expect(screen.queryByText('Prisca Ndlovu')).not.toBeInTheDocument()
    expect(screen.getByText('+27737299929')).toBeInTheDocument()
  })
})

describe('the rule that is not cosmetic', () => {
  // Two voices answering one customer is the bug class this codebase keeps
  // hitting. The composer must not exist until the takeover is real.
  it('offers Take Over instead of a composer while the bot owns the thread', async () => {
    api.get.mockResolvedValue(timeline('qualified'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    await waitFor(() => expect(screen.getByText(/take over to reply/i)).toBeInTheDocument())
    expect(screen.queryByPlaceholderText('Type a message')).not.toBeInTheDocument()
  })

  it('shows the composer once the conversation is taken over', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    await waitFor(() => expect(screen.getByPlaceholderText('Type a message')).toBeInTheDocument())
    expect(screen.queryByText(/take over to reply/i)).not.toBeInTheDocument()
  })

  it('refuses to send on a closed conversation', async () => {
    api.get.mockResolvedValue(timeline('closed'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    await waitFor(() => expect(screen.getByText(/conversation is closed/i)).toBeInTheDocument())
    expect(screen.queryByPlaceholderText('Type a message')).not.toBeInTheDocument()
  })
})

describe('sending', () => {
  it('posts to the lead message endpoint', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    api.post.mockResolvedValue({ data: {} })
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const box = await screen.findByPlaceholderText('Type a message')
    fireEvent.change(box, { target: { value: 'We can do clothing too' } })
    fireEvent.keyDown(box, { key: 'Enter' })

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/admin-ops/leads/l1/message', { message: 'We can do clothing too' },
    ))
  })

  // Losing what someone typed on a phone signal is the worst possible
  // outcome of a failed send.
  it('gives the text back when the send fails', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    api.post.mockRejectedValue({ response: { data: { message: 'Twilio down' } } })
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const box = await screen.findByPlaceholderText('Type a message')
    fireEvent.change(box, { target: { value: 'important reply' } })
    fireEvent.keyDown(box, { key: 'Enter' })

    await waitFor(() => expect(screen.getByText(/twilio down/i)).toBeInTheDocument())
    expect(screen.getByPlaceholderText('Type a message')).toHaveValue('important reply')
  })

  it('does not send an empty message', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const box = await screen.findByPlaceholderText('Type a message')
    fireEvent.change(box, { target: { value: '   ' } })
    fireEvent.keyDown(box, { key: 'Enter' })

    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('on a phone', () => {
  beforeEach(() => setViewport(true))

  it('shows the list first, not an empty thread pane', () => {
    render(<ChatTab conversations={CONVOS} />)
    expect(screen.getByText('Prisca Ndlovu')).toBeInTheDocument()
    expect(screen.queryByText(/pick a conversation/i)).not.toBeInTheDocument()
  })

  it('replaces the list with the thread when one is opened', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    // The other conversation is gone — one pane at a time, like the app.
    await waitFor(() => expect(screen.queryByText('+27737299929')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Back')).toBeInTheDocument()
  })

  it('goes back to the list from a thread', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    fireEvent.click(await screen.findByLabelText('Back'))
    await waitFor(() => expect(screen.getByText('+27737299929')).toBeInTheDocument())
  })

  it('offers a way out of the chat entirely', () => {
    const onExit = vi.fn()
    render(<ChatTab conversations={CONVOS} onExit={onExit} />)
    fireEvent.click(screen.getByLabelText('Back to dashboard'))
    expect(onExit).toHaveBeenCalled()
  })

  // 16px or iOS force-zooms the page on focus and strands the user.
  it('uses a 16px composer so iOS does not zoom', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const box = await screen.findByPlaceholderText('Type a message')
    expect(box).toHaveStyle({ fontSize: '16px' })
  })
})

describe('media in the thread', () => {
  // A customer sent three photos of his proof of payment and the owner saw
  // three blank bubbles: the timeline dropped mediaUrl entirely.
  // Real shape: caption-less media is stored with a stand-in body, because
  // Lead.messages.body is required and an empty string loses the whole write.
  const placeholderFor = (t) =>
    /image/.test(t) ? '📷 Photo'
    : /audio/.test(t) ? '🎤 Voice note'
    : /video/.test(t) ? '🎥 Video'
    : '📎 Document'

  const withMedia = (contentType, body = null) => ({
    data: { data: {
      lead: { _id: 'l1', name: 'Prisca Ndlovu', phone: '+27618076325', workflowStatus: 'taken_over' },
      timeline: [{
        direction: 'inbound', body: body ?? placeholderFor(contentType), timestamp: new Date().toISOString(),
        mediaContentType: contentType, mediaPath: '/admin-ops/leads/l1/media/1',
      }],
    } },
  })

  const open = async () => {
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))
  }

  it('renders a photo as an image, not an empty bubble', async () => {
    api.get.mockResolvedValue(withMedia('image/jpeg'))
    await open()
    const img = await screen.findByRole('img', { name: /photo/i })
    expect(img.getAttribute('src')).toContain('/admin-ops/leads/l1/media/1')
  })

  it('gives a voice note a player', async () => {
    api.get.mockResolvedValue(withMedia('audio/ogg'))
    await open()
    await waitFor(() => {
      const audio = document.querySelector('audio')
      expect(audio).toBeTruthy()
      expect(audio.getAttribute('src')).toContain('/media/1')
    })
  })

  it('offers a document as a link rather than trying to preview it', async () => {
    api.get.mockResolvedValue(withMedia('application/pdf'))
    await open()
    expect(await screen.findByText(/document/i)).toBeInTheDocument()
  })

  // Never the protected Twilio URL — it 401s in a browser, and shipping it
  // would mean shipping the credentials that open it.
  it('never points at Twilio directly', async () => {
    api.get.mockResolvedValue(withMedia('image/jpeg'))
    await open()
    const img = await screen.findByRole('img', { name: /photo/i })
    expect(img.getAttribute('src')).not.toMatch(/api\.twilio\.com/)
  })

  it('keeps the caption alongside the photo when there is one', async () => {
    api.get.mockResolvedValue(withMedia('image/jpeg', 'here is the proof'))
    await open()
    expect(await screen.findByText('here is the proof')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /photo/i })).toBeInTheDocument()
  })

  // WhatsApp does not print the word "Photo" under a photo.
  it('does not repeat the stand-in body under the attachment', async () => {
    api.get.mockResolvedValue(withMedia('image/jpeg'))
    await open()
    await screen.findByRole('img', { name: /photo/i })
    expect(screen.queryByText('📷 Photo')).not.toBeInTheDocument()
  })

  it('still shows a body that only looks like a caption', async () => {
    api.get.mockResolvedValue(withMedia('image/jpeg', 'Photo of the invoice'))
    await open()
    expect(await screen.findByText('Photo of the invoice')).toBeInTheDocument()
  })

  it('labels an attachment in the conversation list preview', () => {
    const convos = [{ ...CONVOS[0], lastMessage: { direction: 'inbound', body: '🎤 Voice note', mediaContentType: 'audio/ogg' } }]
    render(<ChatTab conversations={convos} />)
    expect(screen.getByText(/voice note/i)).toBeInTheDocument()
  })
})

// Baltmore: "why doesn't the chat show the name and the number, we have both."
// A WhatsApp profile name is whatever the customer typed into their own
// phone, so two "Thabo"s are indistinguishable — and the number is what he
// actually calls back on.
describe('name and number together', () => {
  it('shows both in the conversation list', () => {
    render(<ChatTab conversations={CONVOS} />)
    expect(screen.getByText('Prisca Ndlovu')).toBeInTheDocument()
    expect(screen.getByText('+27618076325')).toBeInTheDocument()
  })

  // The fallback row already IS the number. Printing it twice reads as a bug.
  it('does not repeat the number when it is standing in for the name', () => {
    render(<ChatTab conversations={CONVOS} />)
    expect(screen.getAllByText('+27737299929')).toHaveLength(1)
  })

  it('shows the number in the thread header, ready to dial', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const link = await screen.findByRole('link', { name: '+27618076325' })
    expect(link).toHaveAttribute('href', 'tel:+27618076325')
  })

  // Scoped to the header: "Assistant is answering" also appears where the
  // composer would be, and an unscoped match finds both.
  it('still says who is answering, alongside the number', async () => {
    api.get.mockResolvedValue(timeline('qualified'))
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))

    const link = await screen.findByRole('link', { name: '+27618076325' })
    expect(link.closest('p')).toHaveTextContent(/assistant is answering/i)
  })
})

// Baltmore asked for a broadcast button. The reason it is two steps and not
// one: WhatsApp discards a freeform message to anyone who hasn't written in
// 24 hours AND reports it as sent. Every one of his six customers was out of
// window when this was built, so a one-click version would have told him it
// reached everybody having reached nobody.
describe('message everyone', () => {
  const openPanel = () => {
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText(/message everyone/i))
  }

  it('asks who gets it before offering to send', async () => {
    openPanel()
    fireEvent.change(screen.getByPlaceholderText(/what do you want to tell them/i), {
      target: { value: 'New stock arrived' },
    })
    // No send button yet — the reach is unknown.
    expect(screen.queryByText(/^Send to/)).not.toBeInTheDocument()
    expect(screen.getByText(/who gets this/i)).toBeInTheDocument()
  })

  it('runs a dry run first and never sends on the first click', async () => {
    api.post.mockResolvedValue({ data: { audience: { total: 6, inWindow: 1, outOfWindow: 5, excluded: {} }, willReach: 1 } })
    openPanel()
    fireEvent.change(screen.getByPlaceholderText(/what do you want to tell them/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByText(/who gets this/i))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/admin-ops/broadcast', { message: 'Hello', dryRun: true },
    ))
  })

  it('shows the real reach, not the audience size', async () => {
    api.post.mockResolvedValue({ data: { audience: { total: 6, inWindow: 1, outOfWindow: 5, excluded: {} }, willReach: 1 } })
    openPanel()
    fireEvent.change(screen.getByPlaceholderText(/what do you want to tell them/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByText(/who gets this/i))

    expect(await screen.findByText(/reaches 1 of 6/i)).toBeInTheDocument()
    expect(await screen.findByText(/^Send to 1$/)).toBeInTheDocument()
  })

  // The exact SendUs case: nobody is contactable, so there is nothing to confirm.
  it('offers no send button when it would reach nobody', async () => {
    api.post.mockResolvedValue({ data: {
      audience: { total: 6, inWindow: 0, outOfWindow: 6, excluded: {} },
      willReach: 0, warning: '6 people are outside the 24-hour window.',
    } })
    openPanel()
    fireEvent.change(screen.getByPlaceholderText(/what do you want to tell them/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByText(/who gets this/i))

    expect(await screen.findByText(/outside the 24-hour window/i)).toBeInTheDocument()
    expect(screen.queryByText(/^Send to/)).not.toBeInTheDocument()
  })

  it('sends for real only on the second click', async () => {
    api.post
      .mockResolvedValueOnce({ data: { audience: { total: 2, inWindow: 2, outOfWindow: 0, excluded: {} }, willReach: 2 } })
      .mockResolvedValueOnce({ data: { sent: 2, message: 'Sent to 2 people.' } })
    openPanel()
    fireEvent.change(screen.getByPlaceholderText(/what do you want to tell them/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByText(/who gets this/i))
    fireEvent.click(await screen.findByText(/^Send to 2$/))

    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith(
      '/admin-ops/broadcast', { message: 'Hello' },
    ))
    expect(await screen.findByText(/sent to 2 people/i)).toBeInTheDocument()
  })
})

// Outside the 24-hour window WhatsApp discards a normal reply and reports it
// delivered. Showing a composer there takes the owner's message, puts it in
// the thread, and throws it away. Every one of SendUs's six customers was in
// that state, so this is the common case, not the edge one.
describe('reopening a chat that fell outside the window', () => {
  const closedWindow = (extra = {}) => ({
    data: { data: {
      lead: { _id: 'l1', name: 'Sponki', phone: '+27618076325', workflowStatus: 'taken_over', inWindow: false, ...extra },
      timeline: [{ direction: 'inbound', body: 'Im selling clothing', timestamp: new Date().toISOString() }],
    } },
  })

  const open = async () => {
    render(<ChatTab conversations={CONVOS} />)
    fireEvent.click(screen.getByText('Prisca Ndlovu'))
  }

  it('hides the composer and explains why', async () => {
    api.get.mockResolvedValue(closedWindow())
    await open()

    expect(await screen.findByText(/won't deliver a normal reply/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Type a message')).not.toBeInTheDocument()
  })

  it('offers the reopen button', async () => {
    api.get.mockResolvedValue(closedWindow())
    await open()
    expect(await screen.findByText(/reopen this chat/i)).toBeInTheDocument()
  })

  it('sends the approved template to that lead', async () => {
    api.get.mockResolvedValue(closedWindow())
    api.post.mockResolvedValue({ data: { success: true, message: 'Sent.' } })
    await open()
    fireEvent.click(await screen.findByText(/reopen this chat/i))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/leads/l1/reengage'))
  })

  it('reports a refusal instead of claiming it worked', async () => {
    api.get.mockResolvedValue(closedWindow())
    api.post.mockResolvedValue({ data: { success: false, message: 'Sponki is marked do-not-disturb.' } })
    await open()
    fireEvent.click(await screen.findByText(/reopen this chat/i))

    expect(await screen.findByText(/do-not-disturb/i)).toBeInTheDocument()
  })

  // The composer must come back when the window is open — this must not
  // become a permanent replacement.
  it('shows the composer normally when the window is open', async () => {
    api.get.mockResolvedValue({
      data: { data: {
        lead: { _id: 'l1', name: 'Sponki', phone: '+27618076325', workflowStatus: 'taken_over', inWindow: true },
        timeline: [],
      } },
    })
    await open()

    expect(await screen.findByPlaceholderText('Type a message')).toBeInTheDocument()
    expect(screen.queryByText(/reopen this chat/i)).not.toBeInTheDocument()
  })

  // Older responses have no inWindow field at all. Hiding the composer on a
  // missing value would break every thread on a stale deploy.
  it('does not hide the composer when the API says nothing about the window', async () => {
    api.get.mockResolvedValue(timeline('taken_over'))
    await open()
    expect(await screen.findByPlaceholderText('Type a message')).toBeInTheDocument()
  })
})
