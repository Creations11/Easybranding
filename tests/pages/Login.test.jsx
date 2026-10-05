// Signing in. Untested until 2026-10-05.
//
// Three things here are load-bearing and each has gone wrong somewhere in
// this product before:
//   - credentials are trimmed, because they are pasted out of WhatsApp where
//     a trailing space is invisible and turns a right password into a
//     "wrong" one
//   - each role lands on its own page; a role sent to the wrong one meets
//     a dashboard it cannot use (the owner once could not find a tab for
//     exactly this reason)
//   - only the profile is kept in the browser. The session itself is an
//     httpOnly cookie the page never sees
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const post = vi.fn()
vi.mock('../../src/api', () => ({
  default: { post: (...a) => post(...a), get: vi.fn() },
}))

import Login from '../../src/pages/Login'

const renderPage = () => render(<MemoryRouter><Login /></MemoryRouter>)

const signIn = async (user, email, password) => {
  await user.type(screen.getByPlaceholderText('Email address'), email)
  await user.type(screen.getByPlaceholderText('Password'), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

const answerAs = (role) =>
  post.mockResolvedValue({ data: { data: { user: { _id: 'u1', role, fullName: 'Test' } } } })

beforeEach(() => {
  localStorage.clear()
  post.mockReset()
  // jsdom has no navigation; capture where the page sends them.
  delete window.location
  window.location = { href: '' }
})

describe('Login', () => {
  it('trims what was typed before sending it', async () => {
    const user = userEvent.setup()
    answerAs('admin')
    renderPage()

    await signIn(user, '  owner@salon.co.za ', 'sup3rsecret  ')

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'owner@salon.co.za', password: 'sup3rsecret' })
  })

  it.each([
    ['super_admin', '/superadmin'],
    ['eb_manager', '/superadmin'],
    ['eb_agent', '/superadmin'],
    ['admin', '/admin'],
    ['agent', '/agent'],
    ['borrower', '/pending'],
  ])('sends a %s to %s', async (role, page) => {
    const user = userEvent.setup()
    answerAs(role)
    renderPage()

    await signIn(user, 'someone@test.co.za', 'sup3rsecret')

    await waitFor(() => expect(window.location.href).toBe(page))
  })

  it('keeps the profile, and nothing that looks like a token', async () => {
    const user = userEvent.setup()
    answerAs('admin')
    renderPage()

    await signIn(user, 'owner@salon.co.za', 'sup3rsecret')

    await waitFor(() => expect(localStorage.getItem('eb_user')).not.toBeNull())
    expect(JSON.parse(localStorage.getItem('eb_user')).role).toBe('admin')
    expect(Object.keys(localStorage)).toEqual(['eb_user'])
  })

  // The API client lets a 401 from /auth/login through as an answer rather
  // than bouncing to /login, so the page can say what the server said.
  it('shows the server\'s reason and stays put when the password is wrong', async () => {
    const user = userEvent.setup()
    post.mockRejectedValue({ response: { status: 401, data: { message: 'Invalid email or password' } } })
    renderPage()

    await signIn(user, 'owner@salon.co.za', 'wrong')

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
    expect(window.location.href).toBe('')
    expect(localStorage.getItem('eb_user')).toBeNull()
  })
})
