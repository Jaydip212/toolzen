import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling. Provide a no-op so route-change scrolling
// does not emit "Not implemented" noise during tests.
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
  configurable: true,
})
