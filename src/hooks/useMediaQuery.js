// src/hooks/useMediaQuery.js
//
// Reactive CSS media query for components that lay out with inline styles.
//
// This dashboard styles almost everything inline, so a CSS `@media` block
// can't reach most of it. Some layouts also need to differ structurally on a
// phone rather than just visually — the leads board becomes a single column
// with a status picker instead of a horizontal scroll — and that is a
// rendering decision, not a styling one.
//
// Falls back to `false` when matchMedia is missing (jsdom under test, and any
// non-browser render). False means "assume the roomier desktop layout", which
// degrades to the behaviour that existed before this hook.
//
// Built on useSyncExternalStore since 2026-10-05. The window is an external
// store, and that is React's own hook for reading one: it subscribes, reads
// the current value during render, and never shows a stale one. The previous
// version copied the value into state and re-read it in an effect after
// mount, which painted one frame with the wrong layout whenever the window
// changed between the first render and the effect.

import { useCallback, useSyncExternalStore } from 'react';

const hasMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

export default function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    if (!hasMatchMedia()) return () => {};
    const list = window.matchMedia(query);
    // Safari below 14 only has the deprecated addListener.
    if (list.addEventListener) list.addEventListener('change', onChange);
    else list.addListener(onChange);
    return () => {
      if (list.removeEventListener) list.removeEventListener('change', onChange);
      else list.removeListener(onChange);
    };
  }, [query]);

  const getSnapshot = () => (hasMatchMedia() ? window.matchMedia(query).matches : false);

  // The server snapshot is the desktop layout, for the same reason as above.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// One breakpoint, named once, so "is this a phone?" means the same thing
// everywhere rather than being re-guessed per component.
export const MOBILE_QUERY = '(max-width: 768px)';
