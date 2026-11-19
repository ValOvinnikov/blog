import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_BILINGUAL_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
  toPageSuffix,
} from '@web/testing/metadata/to-metadata/fixtures';

import { toPaginatedPageMetadata } from './to-paginated-page-metadata';

vi.mock('@web/server/request-context/request-context');

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_SEO = mockMetadataSeo();
const { title, ogTitle } = MOCK_SEO;
const BLOG_PATH = routes.blogIndex();
const TRANSLATIONS = [
  { language: EN, href: BLOG_PATH },
  { language: NL, href: BLOG_PATH },
];

const buildForPage = (page: number, seo = MOCK_SEO) =>
  toPaginatedPageMetadata(seo, {
    page,
    href: routes.blogIndex(page),
    translations: TRANSLATIONS,
    ogType: 'website',
  });

describe(toPaginatedPageMetadata, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(
      MOCK_BILINGUAL_REQUEST_CONTEXT,
    );
  });

  it('keeps the authored titles and lists hreflang on page 1', async () => {
    const metadata = await buildForPage(1);

    expect(metadata.title).toBe(title);
    expect(metadata.openGraph?.title).toBe(ogTitle);
    expect(metadata.alternates?.languages).toEqual({
      en: BLOG_PATH,
      nl: `${NL_PATH_PREFIX}${BLOG_PATH}`,
      'x-default': BLOG_PATH,
    });
  });

  it('suffixes the titles with the page and lists no hreflang past page 1', async () => {
    const metadata = await buildForPage(2);

    expect(metadata.title).toBe(`${title} ${toPageSuffix(2)}`);
    expect(metadata.openGraph?.title).toBe(`${ogTitle} ${toPageSuffix(2)}`);
    expect(metadata.alternates?.canonical).toBe(routes.blogIndex(2));
    expect(metadata.alternates?.languages).toBeUndefined();
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    const metadata = await buildForPage(
      2,
      mockMetadataSeo({ ogTitle: undefined }),
    );

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });
});
