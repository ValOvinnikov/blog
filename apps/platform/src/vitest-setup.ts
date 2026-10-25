import { format } from 'node:util';

import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { createTranslator } from 'next-intl';

import '@testing-library/jest-dom/vitest';

import messages from './i18n/messages/en.json';

type TGetTranslationsArg = TMaybeUndefined<
  string | { locale?: TLocaleIsoCode; namespace?: string }
>;

const toNamespace = (arg: TGetTranslationsArg): TMaybeUndefined<string> =>
  typeof arg === 'string' ? arg : arg?.namespace;

// createTranslator's const-generic namespace rejects the runtime string one.
type TRawLooseTranslator = TLooseTranslator & {
  raw: (key: string) => unknown;
};
const createLooseTranslator = createTranslator as unknown as (config: {
  locale: string;
  messages: typeof messages;
  namespace?: string;
}) => TRawLooseTranslator;

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
vi.mock('next/navigation', async () => {
  const { createRouterStub } = await import('@platform/testing/router-stub');
  const { NEXT_NAVIGATION_ERROR } = await import('@blog/config');

  return {
    redirect: vi.fn(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    }),
    notFound: vi.fn(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    }),
    permanentRedirect: vi.fn(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    }),
    unstable_rethrow: vi.fn(),
    useParams: vi.fn(() => ({})),
    usePathname: vi.fn(() => '/'),
    useSelectedLayoutSegment: vi.fn(() => null),
    useRouter: vi.fn(createRouterStub),
  };
});

const REACT_ACT_WARNINGS = [
  'not wrapped in act',
  'A suspended resource finished loading inside a test',
  'suspended inside an `act` scope',
];

const actWarnings: string[] = [];
const passThroughConsoleError = console.error;

// Assigned rather than spied, so a test's own spy and its restore wrap this.
console.error = (...args: unknown[]) => {
  const message = format(...args);
  if (REACT_ACT_WARNINGS.some((warning) => message.includes(warning))) {
    actWarnings.push(message);
  }
  passThroughConsoleError(...args);
};

afterEach(() => {
  const warnings = actWarnings.splice(0);
  if (warnings.length > 0) {
    throw new Error(`React reported an act() warning:\n${warnings.join('\n')}`);
  }
});

vi.mock('@platform/utils/logger/logger');

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
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
