import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FETCH_FAILED_REASON, REVALIDATE_LOG } from '@web/constants/revalidate';
import { resolveTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import {
  getTenantPageListResults,
  type TTenantPageListResults,
} from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockTenantPageLists } from '@web/testing/shared/tenant-page-lists/fixtures';
import { logger } from '@web/utils/logger/logger';

import { deriveTenantSitePaths } from './derive-tenant-site-paths';

faker.seed(7383);

vi.mock('@web/server/tenant/tenant-live-locales/tenant-live-locales', () => ({
  resolveTenantLiveLocales: vi.fn(),
}));

vi.mock('@web/server/tenant/tenant-page-lists/tenant-page-lists', () => ({
  getTenantPageListResults: vi.fn(),
}));

const { NL } = LOCALE_ISO_CODES;
const MOCK_LANDING_SLUG = faker.lorem.slug();
const MOCK_DOCUMENT_HREF = `/${faker.lorem.slug()}`;
const NL_ROOT = `/${MOCK_TENANT_ID}/${NL}`;
const MOCK_PAGE_LISTS = mockTenantPageLists({
  landingPages: [{ slug: MOCK_LANDING_SLUG, language: NL }],
});
const MOCK_INPUT = {
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

const toPageListResults = (): TTenantPageListResults => ({
  posts: okResult(MOCK_PAGE_LISTS.posts),
  topics: okResult(MOCK_PAGE_LISTS.topics),
  tags: okResult(MOCK_PAGE_LISTS.tags),
  topicPages: okResult(MOCK_PAGE_LISTS.topicPages),
  tagPages: okResult(MOCK_PAGE_LISTS.tagPages),
  blogPages: okResult(MOCK_PAGE_LISTS.blogPages),
  landingPages: okResult(MOCK_PAGE_LISTS.landingPages),
  privacyDocuments: okResult(MOCK_PAGE_LISTS.privacyDocuments),
  legalDocuments: okResult(MOCK_PAGE_LISTS.legalDocuments),
});

describe(deriveTenantSitePaths, () => {
  beforeEach(() => {
    vi.mocked(resolveTenantLiveLocales).mockResolvedValue(okResult([NL]));
    vi.mocked(getTenantPageListResults).mockResolvedValue(toPageListResults());
  });

  it('resolves the tenant’s pages and the changed document in its live languages', async () => {
    const result = await deriveTenantSitePaths({
      ...MOCK_INPUT,
      documentHref: MOCK_DOCUMENT_HREF,
    });

    expect(getTenantPageListResults).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
      [NL],
    );
    expect(result).toEqual(
      okResult(
        expect.arrayContaining([
          NL_ROOT,
          `${NL_ROOT}/${MOCK_LANDING_SLUG}`,
          `${NL_ROOT}${MOCK_DOCUMENT_HREF}`,
        ]),
      ),
    );
  });

  it('reports fetch_failed and logs when the live locales lookup fails', async () => {
    vi.mocked(resolveTenantLiveLocales).mockResolvedValue(
      errorResult(MOCK_ERROR),
    );

    const result = await deriveTenantSitePaths(MOCK_INPUT);

    expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
    expect(getTenantPageListResults).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      REVALIDATE_LOG.LIVE_LOCALES_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
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
