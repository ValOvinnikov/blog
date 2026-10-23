import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_PAGE_POST_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostParams } from './loader';
import { postParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

describe(getPostParams, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the slug, language and publishedAt entries', async () => {
    const entries = [
      { slug: 'post-a', language: EN, publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'artikel-a', language: NL, publishedAt: '2026-02-01T00:00:00Z' },
    ];
    mockRun.mockResolvedValueOnce(entries);

    const params = await getPostParams(tenant, [EN, NL]);

    expect(params).toEqual(entries);
  });

  it('returns an empty array when there are no posts', async () => {
    const params = await getPostParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes the tags to it', async () => {
    await getPostParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(postParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_POST_CACHE_TAG],
      },
    });
  });
});
