import '@testing-library/jest-dom'

// jsdom implements no layout, so Element.prototype.scrollIntoView does not
// exist — any component that scrolls a ref into view (LeadDetailModal keeps
// its conversation pinned to the newest message) throws inside a passive
// effect and takes the whole test file down with it, with a stack pointing at
// React internals rather than at the missing method.
//
// Stubbed here rather than per-file: it is a gap in the environment, not
// something an individual test should have to know about.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
