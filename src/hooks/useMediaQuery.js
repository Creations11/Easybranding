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

import { useEffect, useState } from 'react';

export default function useMediaQuery(query) {
  const get = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const list = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    // Re-read on mount: the query may have changed between the initial state
    // and the effect running (a resize during hydration, or a changed `query`).
    setMatches(list.matches);

    // Safari below 14 only has the deprecated addListener.
    if (list.addEventListener) list.addEventListener('change', onChange);
    else list.addListener(onChange);

    return () => {
      if (list.removeEventListener) list.removeEventListener('change', onChange);
      else list.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

// One breakpoint, named once, so "is this a phone?" means the same thing
// everywhere rather than being re-guessed per component.
export const MOBILE_QUERY = '(max-width: 768px)';
