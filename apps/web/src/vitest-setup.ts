import { notFound } from 'next/navigation';
import { createTranslator } from 'next-intl';

import '@testing-library/jest-dom/vitest';

import messages from './i18n/messages/en.json';

// Placeholder values for the validated env module (`@/utils/env/env`) so
// components/routes that read it can render under Vitest without requiring
// a real `.env` file. Tests never hit the network, so these values only need
// to satisfy the Zod schema shape.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset';
process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

// jsdom has no `IntersectionObserver` — `useActiveHeadingId` (behind
// `PostContentsRail`) constructs one unconditionally in an effect, so any
// test that renders it without mocking the hook itself would otherwise throw
// `ReferenceError: IntersectionObserver is not defined`. A global no-op stub
// here matches this file's other environment gap-fills (`next/font/google`,
// `next-intl/server`) — tests that need to assert on actual intersection
// behaviour (`use-active-heading-id.test.tsx`) install their own richer fake
// via `vi.stubGlobal` in a scoped `beforeEach`/`afterEach`, which overrides
// this default for the duration of that suite only.
class NoopIntersectionObserver implements IntersectionObserver {
  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);

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
// a fake. `getFormatter` is stubbed the same way for `dateTime`: it delegates
// to the real `Intl.DateTimeFormat` (via `toLocaleDateString`) under the `en`
// locale that `i18n/messages/en.json` represents, so tests assert the real
// rendered date string instead of a fake.
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async (arg?: TGetTranslationsArg) =>
    createLooseTranslator({
      locale: 'en',
      messages,
      namespace: toNamespace(arg),
    }),
  ),
  getFormatter: vi.fn(async () => ({
    dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString('en', options),
  })),
}));

// `next/font/google`'s loader functions (`Space_Grotesk`, `Newsreader`,
// `JetBrains_Mono`, `Fraunces`, `Inter` — see `@web/config/fonts`) rely on a
// Next.js build-time transform that doesn't exist under Vitest, so calling
// them directly throws ("... is not a function"). Stubbed globally, not just
// in the root layout's test, because `fonts.ts` is evaluated at module load
// time by anything that imports the root `app/layout.tsx` (directly or
// transitively) — same reasoning as the `next-intl/server`/`next/navigation`
// mocks above. The stub returns the shape consumers read: a `className`
// string plus a `variable` string derived from the `variable` option, since
// `resolveFontVariableClassName` reads `.variable` off the selected font
// exports to build the root `<html>` className.
vi.mock('next/font/google', () => {
  const createFontMock =
    (fontName: string) =>
    ({ variable }: { variable?: string } = {}) => ({
      className: `mock-${fontName}-className`,
      variable: variable ?? `mock-${fontName}-variable`,
    });

  return {
    Space_Grotesk: createFontMock('space-grotesk'),
    Newsreader: createFontMock('newsreader'),
    JetBrains_Mono: createFontMock('jetbrains-mono'),
    Fraunces: createFontMock('fraunces'),
    Inter: createFontMock('inter'),
  };
});

// `next/navigation`'s `notFound()` must keep throwing so components short-
// circuit exactly as it does at runtime (Next renders the not-found boundary
// via a thrown NEXT_NOT_FOUND digest). Tests that assert on it import the
// binding directly: `import { notFound } from 'next/navigation';` then
// `expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1)`. Cleared before each
// test so call counts never leak across `it`s.
//
// `usePathname`/`useRouter`/`redirect`/`permanentRedirect` are stubbed here
// too — not because any test asserts on them directly (tests that care mock
// the higher-level `@web/i18n/navigation` module instead, which never
// reaches this one), but because `SmartLink` renders next-intl's `Link`,
// whose internals (`createSharedNavigationFns`, `BaseLink`) read these
// bindings off `next/navigation` unconditionally while wiring up navigation,
// even when a test never calls them. `redirect`/`permanentRedirect` mirror
// `notFound`'s throw-to-short-circuit behavior for the same reason.
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
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

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});
