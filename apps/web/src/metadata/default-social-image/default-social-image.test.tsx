import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultSocialImage,
  resolveDefaultSocialImageProps,
} from './default-social-image';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

// `ImageResponse` (Satori/`@vercel/og`) loads its own WASM renderer via a
// real `fetch` the moment it's constructed, independent of anything this
// module does. `fontFetchMock` only intercepts the two Google Fonts calls
// `loadGoogleFont` makes; every other URL (the WASM asset) falls through to
// the real, unmocked fetch so the renderer still initializes.
// Reading `image.arrayBuffer()` here would exercise `@vercel/og`'s Node
// (`sharp`-backed) rendering path, which errors under this Vitest/Node
// combination independent of anything this module does — the actual PNG
// bytes were verified manually instead (`tsx`, outside Vitest; see the PR
// description). These tests stick to the public, stable surface: response
// headers and the `fetch`/console-error side effects.
const realFetch = globalThis.fetch;

describe(buildDefaultSocialImage, () => {
  const fontFetchMock = vi.fn();

  beforeEach(() => {
    fontFetchMock.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        if (url.startsWith('https://fonts.')) {
          return fontFetchMock(url, init);
        }
        return realFetch(input, init);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the brand-mark-only fallback without fetching a font when brandName is absent', async () => {
    const image = await buildDefaultSocialImage({});

    expect(image.headers.get('content-type')).toBe('image/png');
    expect(fontFetchMock).not.toHaveBeenCalled();
  });

  it('fetches the Google Font (with a long revalidate) and renders the brand name when brandName is present', async () => {
    fontFetchMock
      .mockResolvedValueOnce({
        text: () =>
          Promise.resolve(
            "src: url(https://fonts.gstatic.com/font.ttf) format('truetype');",
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

    const image = await buildDefaultSocialImage({
      brandName: 'Test Brand',
      tagline: 'Building things',
    });

    expect(image.headers.get('content-type')).toBe('image/png');
    expect(fontFetchMock).toHaveBeenCalledTimes(2);
    expect(fontFetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('https://fonts.googleapis.com/css2?family='),
      { next: { revalidate: expect.any(Number) } },
    );
    expect(fontFetchMock).toHaveBeenNthCalledWith(
      2,
      'https://fonts.gstatic.com/font.ttf',
      { next: { revalidate: expect.any(Number) } },
    );
    // Both fetches share the same long-lived revalidate window — fonts are
    // effectively immutable per family/weight/subset, so the route can stay
    // static/ISR-eligible instead of being forced fully dynamic.
    const [, firstInit] = fontFetchMock.mock.calls[0] as [
      string,
      RequestInit & { next: { revalidate: number } },
    ];
    expect(firstInit.next.revalidate).toBeGreaterThanOrEqual(60 * 60 * 24 * 30);
  });

  it('falls back to the brand-mark-only image when the Google Fonts CSS response has no matching font source', async () => {
    fontFetchMock.mockResolvedValueOnce({ text: () => Promise.resolve('') });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const image = await buildDefaultSocialImage({ brandName: 'Test Brand' });

    expect(image.headers.get('content-type')).toBe('image/png');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not resolve a font source'),
    );
    consoleErrorSpy.mockRestore();
  });

  it('falls back to the brand-mark-only image when the font file fetch fails', async () => {
    fontFetchMock
      .mockResolvedValueOnce({
        text: () =>
          Promise.resolve(
            "src: url(https://fonts.gstatic.com/font.ttf) format('truetype');",
          ),
      })
      .mockResolvedValueOnce({ ok: false });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const image = await buildDefaultSocialImage({ brandName: 'Test Brand' });

    expect(image.headers.get('content-type')).toBe('image/png');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not fetch font data'),
    );
    consoleErrorSpy.mockRestore();
  });
});

describe(resolveDefaultSocialImageProps, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockReset();
  });

  it('resolves brandName and tagline from site settings', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        brand: { name: 'Test Brand', prefix: 'test', suffix: 'brand' },
        tagline: 'Building things',
      },
    });

    const props = await resolveDefaultSocialImageProps('opengraph-image');

    expect(props).toEqual({
      brandName: 'Test Brand',
      tagline: 'Building things',
    });
  });

  it('returns empty props and logs when site settings fail to load', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const props = await resolveDefaultSocialImageProps('opengraph-image');

    expect(props).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('opengraph-image'),
    );
    consoleErrorSpy.mockRestore();
  });
});
