import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDefaultSocialImage } from './default-social-image';

// `ImageResponse` (Satori/`@vercel/og`) loads its own WASM renderer via a
// real `fetch` the moment it's constructed, independent of anything this
// module does. `fontFetchMock` only intercepts the two Google Fonts calls
// `loadGoogleFont` makes; every other URL (the WASM asset) falls through to
// the real, unmocked fetch so the renderer still initializes.
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
          return fontFetchMock(url);
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

  it('fetches the Google Font and renders the brand name when brandName is present', async () => {
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
    );
    expect(fontFetchMock).toHaveBeenNthCalledWith(
      2,
      'https://fonts.gstatic.com/font.ttf',
    );
  });

  it('throws when the Google Fonts CSS response has no matching font source', async () => {
    fontFetchMock.mockResolvedValueOnce({ text: () => Promise.resolve('') });

    await expect(
      buildDefaultSocialImage({ brandName: 'Test Brand' }),
    ).rejects.toThrow('Could not resolve a font source');
  });

  it('throws when the font file fetch fails', async () => {
    fontFetchMock
      .mockResolvedValueOnce({
        text: () =>
          Promise.resolve(
            "src: url(https://fonts.gstatic.com/font.ttf) format('truetype');",
          ),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(
      buildDefaultSocialImage({ brandName: 'Test Brand' }),
    ).rejects.toThrow('Could not fetch font data');
  });
});
