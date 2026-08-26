// The 401 interceptor — and the two endpoints it must NOT act on.
//
// A blanket "401 → go to /login" threw away the only useful information a
// caller had. NovaCare opened their connect link, the token had already
// been consumed, and instead of "that link has expired, ask us for a new
// one" they were bounced to a password prompt for an account whose password
// they have never had. The page handled the failure correctly; the
// interceptor never let it render.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api from '../src/api'

let handler

beforeEach(() => {
  // The rejection half of the interceptor registered in src/api.js.
  handler = api.interceptors.response.handlers[0].rejected
  delete window.location
  window.location = { href: '' }
})
afterEach(() => vi.clearAllMocks())

const reject = (status, url) =>
  handler({ response: { status }, config: { url } }).catch(() => {})

describe('401 handling', () => {
  it('sends a genuinely expired session to /login', async () => {
    await reject(401, '/tenants')
    expect(window.location.href).toBe('/login')
  })

  it('does NOT redirect a spent handoff link', async () => {
    // The bug this exists for. /continue shows "that link has expired, reply
    // SIGN UP for a new one" — which a redirect replaced with a password box.
    await reject(401, '/auth/handoff')
    expect(window.location.href).toBe('')
  })

  it('does NOT redirect a wrong password', async () => {
    // Bouncing the login page to the login page loses the error message.
    await reject(401, '/auth/login')
    expect(window.location.href).toBe('')
  })

  it('leaves other failures alone', async () => {
    await reject(500, '/tenants')
    await reject(404, '/tenants')
    expect(window.location.href).toBe('')
  })

  it('still rejects, so callers keep their own error handling', async () => {
    await expect(
      handler({ response: { status: 401 }, config: { url: '/auth/handoff' } })
    ).rejects.toBeTruthy()
  })

  it('survives an error with no config', async () => {
    // Network failures arrive without config.url; reading it blindly would
    // throw inside the interceptor and mask the real error.
    await expect(handler({ message: 'Network Error' })).rejects.toBeTruthy()
    expect(window.location.href).toBe('')
  })
})
