import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPageTitle } from './loader';
import { pageTitleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();
const MOCK_PAGE_ID = 'landing-pricing';
const MOCK_PAGE_TITLE = 'Our pricing';

describe(getPageTitle, () => {
  it("returns the page's title", async () => {
    mockRun.mockResolvedValueOnce({ title: MOCK_PAGE_TITLE });

    expect(await getPageTitle(MOCK_PAGE_ID, tenant)).toBe(MOCK_PAGE_TITLE);
  });

  it('returns undefined when no page matches', async () => {
    mockRun.mockResolvedValueOnce(null);

    expect(await getPageTitle(MOCK_PAGE_ID, tenant)).toBeUndefined();
  });

  it('reads the id under the tags the webhook purges for home and landing pages', async () => {
    mockRun.mockResolvedValueOnce({ title: MOCK_PAGE_TITLE });

    await getPageTitle(MOCK_PAGE_ID, tenant);

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(pageTitleQuery, {
      parameters: { id: MOCK_PAGE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_HOME_PAGE_CACHE_TAG, MOCK_PAGE_LANDING_CACHE_TAG],
      },
    });
  });
});
