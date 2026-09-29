import { SITE_MESSAGES } from '@blog/config';
import { createTranslator } from 'next-intl';

import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset';
process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

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

class NoopResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', NoopResizeObserver);

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

// jsdom lays nothing out, so Embla would measure every slide at 0px and never
// show its controls: give carousel slides a width that overflows the track.
const CAROUSEL_TRACK_WIDTH = 400;
const CAROUSEL_SLIDE_WIDTH = 300;

const isInCarousel = (element: HTMLElement) =>
  element.closest('[aria-roledescription="carousel"]') !== null;

const isCarouselSlide = (element: HTMLElement) =>
  element.tagName === 'LI' && isInCarousel(element);

if (typeof HTMLElement !== 'undefined') {
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: {
      configurable: true,
      get(this: HTMLElement) {
        if (isCarouselSlide(this)) return CAROUSEL_SLIDE_WIDTH;
        return isInCarousel(this) ? CAROUSEL_TRACK_WIDTH : 0;
      },
    },
    offsetLeft: {
      configurable: true,
      get(this: HTMLElement) {
        if (!isCarouselSlide(this)) return 0;
        const siblings = Array.from(this.parentElement?.children ?? []);
        return siblings.indexOf(this) * CAROUSEL_SLIDE_WIDTH;
      },
    },
  });
}

type TGetTranslationsArg = string | { namespace?: string } | undefined;
type TTranslationValues = Record<string, string | number>;

const toNamespace = (arg: TGetTranslationsArg): string | undefined =>
  typeof arg === 'string' ? arg : arg?.namespace;

// `createTranslator` infers its namespace as a literal union from the messages
// shape, which rejects the plain string this mock resolves at runtime.
type TLooseTranslator = (key: string, values?: TTranslationValues) => string;
const createLooseTranslator = createTranslator as unknown as (config: {
  locale: string;
  messages: typeof SITE_MESSAGES;
  namespace?: string;
}) => TLooseTranslator;

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getLocale: vi.fn(async () => 'en'),
  getTranslations: vi.fn(async (arg?: TGetTranslationsArg) =>
    createLooseTranslator({
      locale: 'en',
      messages: SITE_MESSAGES,
      namespace: toNamespace(arg),
    }),
  ),
  getFormatter: vi.fn(async () => ({
    dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString('en', options),
  })),
}));

// The `next/font/google` loaders rely on a Next build-time transform and throw
// when `@web/config/fonts` is evaluated under Vitest.
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

// next-intl's `Link` reads `usePathname`/`useRouter` off `next/navigation`
// even when a test never navigates.
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
