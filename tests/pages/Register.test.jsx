// Registering a business — the screen that used to dead-end.
//
// This page always showed "pending approval — an admin reviews your account",
// and it never sent a business name. Both had to be true for a self-service
// signup to work, and neither was:
//
//   - no businessName in the payload, so the API took the invited-user
//     branch and genuinely DID return pending
//   - the response's `pending` field was ignored anyway
//
// The result was that every website signup landed on a screen telling them to
// wait for a human who was never coming. The onboarding wizard is the only
// place Embedded Signup lives, so nobody ever reached it — the entire
// automatic go-live chain sat behind a screen no customer could pass.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const post = vi.fn()
const get = vi.fn()
vi.mock('../../src/api', () => ({
  default: { post: (...a) => post(...a), get: (...a) => get(...a) },
}))

import Register from '../../src/pages/Register'

const renderPage = (path = '/register') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Register />
    </MemoryRouter>
  )

beforeEach(() => {
  localStorage.clear()
  // The plan badge fetches the price list; irrelevant to these assertions.
  get.mockResolvedValue({ data: { data: { products: [] } } })
  // jsdom has no navigation; capture where the page tries to go.
  delete window.location
  window.location = { href: '' }
  // Invite validation uses raw fetch, not the api client — unmocked it
  // rejects, the page decides the invite is invalid, and it replaces the
  // whole form with "contact your agency admin".
  global.fetch = vi.fn(async () => ({
    json: async () => ({ success: true, data: { businessName: 'Acme' } }),
  }))
})

afterEach(() => vi.clearAllMocks())

const fillAndSubmit = async (user, { business = 'Test Salon' } = {}) => {
  await user.type(screen.getByPlaceholderText('Full name'), 'Ayanda')
  if (business !== null) {
    await user.type(screen.getByPlaceholderText('Business name'), business)
  }
  await user.type(screen.getByPlaceholderText('Email address'), 'owner@salon.co.za')
  await user.type(screen.getByPlaceholderText('Phone number'), '+27820000001')
  await user.type(screen.getByPlaceholderText('Password'), 'sup3rsecret')
  await user.click(screen.getByRole('button', { name: /create|register|request/i }))
}

describe('Register', () => {
  it('asks for a business name — without it the API cannot self-serve', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Business name')).toBeTruthy()
  })

  it('sends the business name, which is what selects the self-service branch', async () => {
    const user = userEvent.setup()
    post.mockResolvedValue({ data: { data: { pending: false, user: { role: 'admin' } } } })
    renderPage()

    await fillAndSubmit(user)

    await waitFor(() => expect(post).toHaveBeenCalled())
    const [url, body] = post.mock.calls[0]
    expect(url).toBe('/auth/register')
    expect(body.businessName).toBe('Test Salon')
  })

  it('signs a self-served owner in and sends them to the wizard', async () => {
    // The wizard is where Embedded Signup and checkout live. Landing them
    // anywhere else is the bug this file exists for.
    const user = userEvent.setup()
    post.mockResolvedValue({
      data: { data: { pending: false, tenantId: 'abc123', user: { role: 'admin', email: 'owner@salon.co.za' } } },
    })
    renderPage()

    await fillAndSubmit(user)

    await waitFor(() => expect(window.location.href).toBe('/onboarding'))
    // Token rides in an httpOnly cookie; only the user object is stored.
    expect(JSON.parse(localStorage.getItem('eb_user')).role).toBe('admin')
    expect(screen.queryByText(/pending approval/i)).toBeNull()
  })

  it('still shows pending approval for an invited user', async () => {
    // That gate protects an EXISTING tenant's data and is not what changed.
    const user = userEvent.setup()
    post.mockResolvedValue({ data: { data: { pending: true, tenantName: 'Acme' } } })
    renderPage('/register?invite=tok123')

    // An invite has no business-name field — they join a tenant that has one.
    expect(screen.queryByPlaceholderText('Business name')).toBeNull()

    await user.type(screen.getByPlaceholderText('Full name'), 'Ayanda')
    await user.type(screen.getByPlaceholderText('Email address'), 'staff@acme.co.za')
    await user.type(screen.getByPlaceholderText('Phone number'), '+27820000002')
    await user.type(screen.getByPlaceholderText('Password'), 'sup3rsecret')
    await user.click(screen.getByRole('button', { name: /create|register|request|join/i }))

    await waitFor(() => expect(screen.getByText(/pending approval/i)).toBeTruthy())
    expect(window.location.href).toBe('')
    expect(localStorage.getItem('eb_user')).toBeNull()
  })

  it('never prints a hardcoded price', async () => {
    // This page carried a sixth copy of the price list — "Starter R950 /
    // Growth R2,450". R950 is nearly 10x what Venbus pays and R2,450 is a
    // figure no tenant has ever been charged, so somebody arriving from a
    // pricing link was greeted with a price we do not sell.
    get.mockResolvedValue({
      data: { data: { products: [{ key: 'ai_receptionist', label: 'AI Receptionist', price: 99 }] } },
    })
    renderPage('/register?plan=ai_receptionist')

    await waitFor(() => expect(screen.getByText('AI Receptionist')).toBeTruthy())
    expect(screen.getByText('R99/mo')).toBeTruthy()
    expect(screen.queryByText(/R950|R2,450/)).toBeNull()
  })
})
