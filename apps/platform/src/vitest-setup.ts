import { createTranslator } from 'next-intl';

import '@testing-library/jest-dom/vitest';

import messages from './i18n/messages/en.json';

type TGetTranslationsArg = string | { namespace?: string } | undefined;
type TTranslationValues = Record<string, string | number>;

const toNamespace = (arg: TGetTranslationsArg): string | undefined =>
  typeof arg === 'string' ? arg : arg?.namespace;

// `createTranslator`'s `Namespace` type parameter is a `const` generic
// inferred as a literal union from the *actual* messages shape, so it
// rejects the plain `string | undefined` this mock resolves a namespace to
// at runtime. Widened once here to the shape every call site below actually
// uses (`t(key, values)`), rather than fighting the literal-union inference
// per call.
type TLooseTranslator = (key: string, values?: TTranslationValues) => string;
const createLooseTranslator = createTranslator as unknown as (config: {
  locale: string;
  messages: typeof messages;
  namespace?: string;
}) => TLooseTranslator;

// `next-intl/server`'s `setRequestLocale` is called by every locale-aware
// layout/page but never asserted on — stub it globally so individual test
// files don't repeat the mock. `getTranslations` is stubbed as a minimal
// stand-in that resolves real strings from `i18n/messages/en.json` via
// next-intl's own `createTranslator` (full ICU — interpolation, plurals,
// select) so component tests assert on the actual rendered copy instead of
// a fake.
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async (arg?: TGetTranslationsArg) =>
    createLooseTranslator({
      locale: 'en',
      messages,
      namespace: toNamespace(arg),
    }),
  ),
  getMessages: vi.fn(async () => messages),
}));

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
// `unstable_rethrow` is a no-op stub: real Next.js only re-throws an error
// shaped like its own internal redirect/notFound digest, and returns
// normally for anything else — a plain caught `Error` in a test (e.g. a
// component's own error-boundary-style try/catch) should fall through the
// same way, not be swallowed or crash the test.
// `permanentRedirect` is stubbed for the same reason as `usePathname`/
// `useRouter` below: not asserted on directly, but `@platform/i18n/navigation`'s
// `createNavigation` (next-intl) reads it off `next/navigation`
// unconditionally while wiring up its own exports, even when a test never
// calls it — matching apps/web's identical setup.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  unstable_rethrow: vi.fn(),
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
// anything. Guarded by `typeof Element` since this setup file also runs
// under the `node` project (`.ts` tests), where no DOM globals exist at all.
if (typeof Element !== 'undefined') {
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
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', NoopResizeObserver);
}

// `next/font/google`'s loader functions (`@platform/config/fonts`'s five
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
