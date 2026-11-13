import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FETCH_FAILED_REASON, REVALIDATE_LOG } from '@web/constants/revalidate';
import { routing } from '@web/i18n/routing';
import { getTenantPageListResults } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockTenantPageLists } from '@web/testing/shared/tenant-page-lists/fixtures';
import { buildTenantSitePaths } from '@web/utils/build-tenant-site-paths';
import { logger } from '@web/utils/logger/logger';

import { deriveTenantSitePaths } from './derive-tenant-site-paths';

faker.seed(7383);

const { getTenantLiveLocalesMock } = vi.hoisted(() => ({
  getTenantLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantLiveLocales: getTenantLiveLocalesMock } },
}));

vi.mock('@web/server/tenant/tenant-page-lists/tenant-page-lists');

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_LANDING_SLUG = faker.lorem.slug();
const MOCK_REMOVED_POST_SLUG = faker.lorem.slug();
const MOCK_PAGE_LISTS = mockTenantPageLists({
  landingPages: [{ slug: MOCK_LANDING_SLUG, language: NL }],
});
const MOCK_INPUT = {
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

const toPageListResults = (lists = MOCK_PAGE_LISTS) => ({
  posts: okResult(lists.posts),
  topics: okResult(lists.topics),
  tags: okResult(lists.tags),
  topicPages: okResult(lists.topicPages),
  tagPages: okResult(lists.tagPages),
  blogPages: okResult(lists.blogPages),
  landingPages: okResult(lists.landingPages),
  privacyDocuments: okResult(lists.privacyDocuments),
  legalDocuments: okResult(lists.legalDocuments),
});

describe(deriveTenantSitePaths, () => {
  beforeEach(() => {
    getTenantLiveLocalesMock.mockResolvedValue([EN, NL]);
    vi.mocked(getTenantPageListResults).mockResolvedValue(toPageListResults());
  });

  it('resolves every page of the tenant in its live languages', async () => {
    const result = await deriveTenantSitePaths({
      ...MOCK_INPUT,
      removedPostSlug: MOCK_REMOVED_POST_SLUG,
    });

    expect(getTenantPageListResults).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
      [EN, NL],
    );
    expect(result).toEqual(
      okResult(
        buildTenantSitePaths({
          tenantId: MOCK_TENANT_ID,
          locales: [EN, NL],
          lists: MOCK_PAGE_LISTS,
          removedPostSlug: MOCK_REMOVED_POST_SLUG,
        }),
      ),
    );
  });

  it('falls back to the default locale when the tenant has no live locales', async () => {
    getTenantLiveLocalesMock.mockResolvedValue(undefined);

    await deriveTenantSitePaths(MOCK_INPUT);

    expect(getTenantPageListResults).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
      [routing.defaultLocale],
    );
  });

  it('reports fetch_failed and logs the list whose lookup fails', async () => {
    vi.mocked(getTenantPageListResults).mockResolvedValue({
      ...toPageListResults(),
      tags: errorResult(MOCK_ERROR),
    });

    const result = await deriveTenantSitePaths(MOCK_INPUT);

    expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
    expect(logger.error).toHaveBeenCalledWith(
      REVALIDATE_LOG.TENANT_PAGE_LIST_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, list: 'tags', error: MOCK_ERROR },
    );
  });
});
