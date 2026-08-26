// /continue — the page a one-time link lands on.
//
// The token is consumed on page load, which is right: a link that survives
// failure survives forwarding. But it meant a FAILED attempt burned the
// link — NovaCare hit Meta's "JSSDK Option is Not Toggled" and retrying
// after the fix needed a whole new link minted by hand.
//
// The fix is order-sensitive in a way that is dangerous to get backwards,
// which is what most of this file is about.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const post = vi.fn()
const get = vi.fn()
vi.mock('../../src/api', () => ({
  default: { post: (...a) => post(...a), get: (...a) => get(...a) },
}))

// The Meta dialog itself is not under test here.
vi.mock('../../src/components/ConnectWhatsApp', () => ({
  default: () => <div data-testid="connect">Connect my WhatsApp number</div>,
}))

import Continue from '../../src/pages/Continue'

const at = (path) =>
  render(<MemoryRouter initialEntries={[path]}><Continue /></MemoryRouter>)

beforeEach(() => {
  localStorage.clear()
  get.mockResolvedValue({ data: { data: {} } })
})
afterEach(() => vi.clearAllMocks())

describe('/continue', () => {
  it('redeems a token and shows the connect step', async () => {
    post.mockResolvedValue({ data: { data: { user: { fullName: 'Novacare', role: 'admin' } } } })

    at('/continue?t=abc123')

    await waitFor(() => expect(screen.getByTestId('connect')).toBeTruthy())
    expect(post).toHaveBeenCalledWith('/auth/handoff', { token: 'abc123' })
    expect(JSON.parse(localStorage.getItem('eb_user')).fullName).toBe('Novacare')
  })

  it('lets someone back in on a refresh, without a token', async () => {
    // The whole point of the fix: a failed attempt should not cost a link.
    localStorage.setItem('eb_user', JSON.stringify({ fullName: 'Novacare', role: 'admin' }))

    at('/continue')

    await waitFor(() => expect(screen.getByTestId('connect')).toBeTruthy())
    expect(post).not.toHaveBeenCalled()
  })

  it('ALWAYS prefers the token over an existing session', async () => {
    // The dangerous case. An operator logged in as super_admin opening a
    // client's link must connect the CLIENT's number, not their own — the
    // token names who the page is for; the session only says who this
    // browser is.
    localStorage.setItem('eb_user', JSON.stringify({ fullName: 'Ayanda', role: 'super_admin' }))
    post.mockResolvedValue({ data: { data: { user: { fullName: 'Novacare', role: 'admin' } } } })

    at('/continue?t=clienttoken')

    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/handoff', { token: 'clienttoken' }))
    // The operator's session was replaced by the tenant the link named.
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('eb_user')).fullName).toBe('Novacare')
    )
  })

  it('says the link is spent rather than showing a dead end', async () => {
    post.mockRejectedValue({
      response: { data: { message: 'That link has expired or has already been used.' } },
    })

    at('/continue?t=stale')

    await waitFor(() => expect(screen.getByText(/no longer works/i)).toBeTruthy())
    expect(screen.getByText(/expired or has already been used/i)).toBeTruthy()
    // And tells them how to get another, on the channel they came from.
    expect(screen.getByText(/SIGN UP/)).toBeTruthy()
  })

  it('fails cleanly with neither token nor session', async () => {
    at('/continue')

    await waitFor(() => expect(screen.getByText(/no longer works/i)).toBeTruthy())
    expect(post).not.toHaveBeenCalled()
  })

  it('recovers from a corrupt session entry instead of crashing', async () => {
    localStorage.setItem('eb_user', 'not json')

    at('/continue')

    await waitFor(() => expect(screen.getByText(/no longer works/i)).toBeTruthy())
    expect(localStorage.getItem('eb_user')).toBeNull()
  })
})
