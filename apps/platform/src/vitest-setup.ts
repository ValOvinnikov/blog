import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { createTranslator } from 'next-intl';

import '@testing-library/jest-dom/vitest';

import messages from './i18n/messages/en.json';

type TGetTranslationsArg =
  string | { locale?: TLocaleIsoCode; namespace?: string } | undefined;
type TTranslationValues = Record<string, string | number>;

const toNamespace = (arg: TGetTranslationsArg): string | undefined =>
  typeof arg === 'string' ? arg : arg?.namespace;

// createTranslator's const-generic namespace rejects the runtime string one.
type TLooseTranslator = ((
  key: string,
  values?: TTranslationValues,
) => string) & { raw: (key: string) => unknown };
const createLooseTranslator = createTranslator as unknown as (config: {
  locale: string;
  messages: typeof messages;
  namespace?: string;
}) => TLooseTranslator;

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getLocale: vi.fn(async () => LOCALE_ISO_CODES.EN),
  getTranslations: vi.fn(async (arg?: TGetTranslationsArg) =>
    createLooseTranslator({
      locale: 'en',
      messages:
        typeof arg === 'object' && arg.locale
          ? (await import(`./i18n/messages/${arg.locale.toLowerCase()}.json`))
              .default
          : messages,
      namespace: toNamespace(arg),
    }),
  ),
  getMessages: vi.fn(async () => messages),
}));

// Total: an export not listed here is undefined, so add it here, never per test.
// createNavigation reads permanentRedirect at import, so it must exist.
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
  useParams: vi.fn(() => ({})),
  usePathname: vi.fn(() => '/'),
  useSelectedLayoutSegment: vi.fn(() => null),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Unsaved settings drafts persist in localStorage, so one test's draft would
// otherwise be offered for restore in the next.
beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

// Base UI's floating components call these, and jsdom implements none of them.
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

// next/font/local relies on a Next build transform Vitest does not run.
vi.mock('next/font/local', () => ({
  default: ({ src }: { src: { path: string }[] }) => {
    const fontName = src[0]?.path.split('/').pop()?.replace('.woff2', '');
    return {
      className: `mock-${fontName}-className`,
      style: { fontFamily: `mock-${fontName}-font-family` },
    };
  },
}));

vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
}));
