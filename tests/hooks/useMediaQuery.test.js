// useMediaQuery decides structural layout (a phone gets a one-column board),
// so it must be right on the first render and must follow the window when it
// changes while mounted. The component tests stub a fixed viewport; this one
// covers the change itself, which they never exercise.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useMediaQuery, { MOBILE_QUERY } from '../../src/hooks/useMediaQuery'

// A matchMedia whose answer the test controls, firing 'change' like a browser.
const fakeMatchMedia = (initial) => {
  let matches = initial
  const listeners = new Set()
  const list = {
    get matches() { return matches },
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  }
  return {
    matchMedia: vi.fn(() => list),
    resize: (next) => { matches = next; listeners.forEach((fn) => fn({ matches: next })) },
    listenerCount: () => listeners.size,
  }
}

afterEach(() => { vi.unstubAllGlobals() })

describe('useMediaQuery', () => {
  it('answers correctly on the very first render', () => {
    const mm = fakeMatchMedia(true)
    vi.stubGlobal('matchMedia', mm.matchMedia)
    const { result } = renderHook(() => useMediaQuery(MOBILE_QUERY))
    expect(result.current).toBe(true)
  })

  it('follows the window when it changes while mounted', () => {
    const mm = fakeMatchMedia(false)
    vi.stubGlobal('matchMedia', mm.matchMedia)
    const { result } = renderHook(() => useMediaQuery(MOBILE_QUERY))
    expect(result.current).toBe(false)

    act(() => mm.resize(true))
    expect(result.current).toBe(true)

    act(() => mm.resize(false))
    expect(result.current).toBe(false)
  })

  it('stops listening when it unmounts', () => {
    const mm = fakeMatchMedia(false)
    vi.stubGlobal('matchMedia', mm.matchMedia)
    const { unmount } = renderHook(() => useMediaQuery(MOBILE_QUERY))
    expect(mm.listenerCount()).toBe(1)
    unmount()
    expect(mm.listenerCount()).toBe(0)
  })

  // jsdom and any non-browser render: assume the roomier desktop layout.
  it('falls back to the desktop layout without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useMediaQuery(MOBILE_QUERY))
    expect(result.current).toBe(false)
  })
})
