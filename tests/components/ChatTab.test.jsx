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

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
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
