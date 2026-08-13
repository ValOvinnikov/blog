import '@testing-library/jest-dom/vitest';

// `next/navigation`'s `redirect()`/`notFound()` must keep throwing so a gate
// component short-circuits exactly as it does at runtime (Next renders both
// via a thrown digest) — mocked globally since every layout under a gated
// segment calls one of them, not just the one test file that asserts on it.
// This mock is total: it exports only these two, so a future test importing
// e.g. `usePathname` gets `undefined` and must widen it.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// jsdom implements neither the Pointer Events capture methods nor
// `ResizeObserver`, both of which Base UI's floating-positioned components
// (e.g. `Menu`) call unconditionally — without these no-op stand-ins every
// such test throws `TypeError: … is not a function` before it can assert
// anything.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', NoopResizeObserver);
}
