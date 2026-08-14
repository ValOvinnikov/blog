import '@testing-library/jest-dom/vitest';

// `next/navigation`'s `redirect()`/`notFound()` must keep throwing so a gate
// component short-circuits exactly as it does at runtime (Next renders both
// via a thrown digest) — mocked globally since every layout under a gated
// segment calls one of them, not just the one test file that asserts on it.
// This mock is total: a future test importing another export gets
// `undefined` and must widen it. `usePathname` defaults to `/` — tests that
// care about a specific route override it with `vi.mocked(usePathname)
// .mockReturnValue(...)`. `useRouter`'s default stub returns a brand-new
// `refresh: vi.fn()` on every render, matching apps/web's own setup — a test
// that asserts a call to `refresh` overrides it with `vi.mocked(useRouter)
// .mockReturnValue(...)`.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
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

// `next/font/google`'s loader functions (`@admin/config/fonts`'s five
// `FONT_CHOICE` loaders) rely on a Next.js build-time transform that doesn't
// exist under Vitest, so calling them directly throws. Stubbed globally,
// since the Look tab's font pickers are evaluated at module load time by
// anything importing them, not just their own test file.
vi.mock('next/font/google', () => {
  const createFontMock = (fontName: string) => () => ({
    className: `mock-${fontName}-className`,
    style: { fontFamily: `mock-${fontName}-font-family` },
  });

  return {
    Space_Grotesk: createFontMock('space-grotesk'),
    Newsreader: createFontMock('newsreader'),
    JetBrains_Mono: createFontMock('jetbrains-mono'),
    Fraunces: createFontMock('fraunces'),
    Inter: createFontMock('inter'),
  };
});
