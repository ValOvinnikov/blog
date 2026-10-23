import { LOCALE_ISO_CODES } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { toLocalizedPageMetadata } from './to-localized-page-metadata';

const NL_POST_PATH = '/blog/mijn-artikel';

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe(toLocalizedPageMetadata, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  it('emits the page language as og:locale and each live translation as og:locale:alternate', async () => {
    const metadata = await toLocalizedPageMetadata(mockSeo(), {
      href: '/topics',
      translations: [
        { language: EN, href: '/topics' },
        { language: NL, href: '/topics' },
        { language: DE, href: '/topics' },
      ],
      ogType: 'website',
    });

    expect(metadata.openGraph?.locale).toBe('en_US');
    expect(metadata.openGraph?.alternateLocale).toEqual(['nl_NL']);
    expect(metadata.openGraph?.url).toBe('/topics');
  });

  it('emits the request language as og:locale on a non-default translation', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });

    const metadata = await toLocalizedPageMetadata(mockSeo(), {
      href: NL_POST_PATH,
      translations: [
        { language: EN, href: '/blog/my-article' },
        { language: NL, href: NL_POST_PATH },
      ],
      ogType: 'article',
    });

    expect(metadata.openGraph?.locale).toBe('nl_NL');
    expect(metadata.openGraph?.alternateLocale).toEqual(['en_US']);
    expect(metadata.openGraph?.url).toBe('/nl/blog/mijn-artikel');
  });

  it('emits og:locale without og:locale:alternate when the page has no translations', async () => {
    const metadata = await toLocalizedPageMetadata(mockSeo(), {
      href: '/blog/page/2',
      translations: [],
      ogType: 'website',
    });

    expect(metadata.openGraph?.locale).toBe('en_US');
    expect(metadata.openGraph?.alternateLocale).toBeUndefined();
  });
});
