import {
  CONTENT_ALIGNMENT,
  SANITY_CONTENT_REVALIDATE_SECONDS,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawCookieStatementPage } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getCookieStatementPage } from './loader';
import { cookieStatementPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(65140);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_META_TITLE = faker.lorem.words(4);
const MOCK_HEADING = faker.lorem.words(3);

const tenant = mockTenant();

describe(getCookieStatementPage, () => {
  it('resolves undefined when the locale has no cookie statement', async () => {
    mockRun.mockResolvedValueOnce(null);

    expect(await getCookieStatementPage(tenant)).toBeUndefined();
  });

  it('maps the raw page into a cookie statement', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawCookieStatementPage({
        _id: MOCK_ID,
        title: MOCK_TITLE,
        seo: mockRawSeo({ metaTitle: MOCK_META_TITLE }),
        translations: [{ language: EN }, { language: NL }],
      }),
    );

    expect(await getCookieStatementPage(tenant)).toMatchObject({
      id: MOCK_ID,
      title: MOCK_TITLE,
      body: [],
      seo: { title: MOCK_META_TITLE },
      translations: [EN, NL],
    });
  });

  it('maps the heading block and its alignment', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawCookieStatementPage({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING),
        contentAlignment: CONTENT_ALIGNMENT.CENTER,
      }),
    );

    expect(await getCookieStatementPage(tenant)).toMatchObject({
      headingBlock: { heading: MOCK_HEADING },
      headingAlignment: CONTENT_ALIGNMENT.CENTER,
    });
  });

  it('maps a cookie statement with no heading block to a left-aligned page without one', async () => {
    mockRun.mockResolvedValueOnce(mockRawCookieStatementPage());

    const result = await getCookieStatementPage(tenant);

    expect(result?.headingBlock).toBeUndefined();
    expect(result?.headingAlignment).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('queries the tenant under every tag its links read', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getCookieStatementPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(cookieStatementPageQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_TOPIC_CACHE_TAG, ...MOCK_LINK_TARGET_CACHE_TAGS],
      },
    });
  });
});
