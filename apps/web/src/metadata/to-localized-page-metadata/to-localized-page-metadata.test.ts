import { LOCALE_ISO_CODES, LOCALE_OPEN_GRAPH_TAGS, routes } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockRequestContextOnce } from '@web/testing/server/request-context/mock-request-context-once';
import {
  MOCK_DE_POST_SLUG,
  MOCK_EN_POST_SLUG,
  MOCK_NL_POST_SLUG,
} from '@web/testing/shared/post/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import type { TLanguagePage } from '@web/utils/to-language-alternates';

import { toLocalizedPageMetadata } from './to-localized-page-metadata';

const EN_POST_PATH = routes.post(MOCK_EN_POST_SLUG);
const NL_POST_PATH = routes.post(MOCK_NL_POST_SLUG);
const DE_POST_PATH = routes.post(MOCK_DE_POST_SLUG);
const TOPICS_PATH = routes.topics();

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;

const EN_PAGE = { language: EN, href: EN_POST_PATH };
const NL_PAGE = { language: NL, href: NL_POST_PATH };
const DE_PAGE = { language: DE, href: DE_POST_PATH };

const buildFor = (
  translations: readonly TLanguagePage[],
  href = EN_POST_PATH,
) =>
  toLocalizedPageMetadata(mockSeo(), { href, translations, ogType: 'article' });

describe(toLocalizedPageMetadata, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  it('emits the page language as og:locale and live translations as alternates', async () => {
    const metadata = await toLocalizedPageMetadata(mockSeo(), {
      href: TOPICS_PATH,
      translations: [
        { language: EN, href: TOPICS_PATH },
        { language: NL, href: TOPICS_PATH },
        { language: DE, href: TOPICS_PATH },
      ],
      ogType: 'website',
    });

    expect(metadata.openGraph?.locale).toBe(LOCALE_OPEN_GRAPH_TAGS.EN);
    expect(metadata.openGraph?.alternateLocale).toEqual([
      LOCALE_OPEN_GRAPH_TAGS.NL,
    ]);
    expect(metadata.openGraph?.url).toBe(TOPICS_PATH);
  });

  it('emits the request language and its own prefixed canonical on a translation', async () => {
    mockRequestContextOnce({ locale: NL, liveLocales: [EN, NL] });

    const metadata = await buildFor([EN_PAGE, NL_PAGE], NL_POST_PATH);

    expect(metadata.openGraph?.locale).toBe(LOCALE_OPEN_GRAPH_TAGS.NL);
    expect(metadata.openGraph?.alternateLocale).toEqual([
      LOCALE_OPEN_GRAPH_TAGS.EN,
    ]);
    expect(metadata.openGraph?.url).toBe(`/nl${NL_POST_PATH}`);
    expect(metadata.alternates).toEqual({
      canonical: `/nl${NL_POST_PATH}`,
      languages: {
        en: EN_POST_PATH,
        nl: `/nl${NL_POST_PATH}`,
        'x-default': EN_POST_PATH,
      },
    });
  });

  it('emits og:locale without alternates when the page has no translations', async () => {
    const metadata = await toLocalizedPageMetadata(mockSeo(), {
      href: routes.blogIndex(2),
      translations: [],
      ogType: 'website',
    });

    expect(metadata.openGraph?.locale).toBe(LOCALE_OPEN_GRAPH_TAGS.EN);
    expect(metadata.openGraph?.alternateLocale).toBeUndefined();
  });

  it('lists each live translation as hreflang with x-default on the default language', async () => {
    const metadata = await buildFor([EN_PAGE, NL_PAGE, DE_PAGE]);

    expect(metadata.alternates).toEqual({
      canonical: EN_POST_PATH,
      languages: {
        en: EN_POST_PATH,
        nl: `/nl${NL_POST_PATH}`,
        'x-default': EN_POST_PATH,
      },
    });
  });

  it('omits x-default when no translation exists in the default language', async () => {
    mockRequestContextOnce({ liveLocales: [EN, NL, DE] });

    const metadata = await buildFor([NL_PAGE, DE_PAGE]);

    expect(metadata.alternates?.languages).toEqual({
      nl: `/nl${NL_POST_PATH}`,
      de: `/de${DE_POST_PATH}`,
    });
  });

  it.each([
    { case: 'there are no translations', translations: [] },
    {
      case: 'the only translation is the page itself',
      translations: [EN_PAGE],
    },
    {
      case: 'the only other translation is not live',
      translations: [EN_PAGE, DE_PAGE],
    },
    {
      case: 'the tenant has no live list',
      translations: [EN_PAGE, NL_PAGE],
      context: { liveLocales: undefined },
    },
  ])('lists no hreflang when $case', async ({ translations, context }) => {
    if (context) mockRequestContextOnce(context);

    const metadata = await buildFor(translations);

    expect(metadata.alternates).toEqual({ canonical: EN_POST_PATH });
  });
});
