import { SANITY_WEBHOOK_OPERATION } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  PATH_UNDERIVABLE_REASON,
} from '@web/constants/revalidate';
import { derivePostPublishPaths } from '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { deriveRevalidatePaths, POST_TYPE } from './derive-revalidate-paths';

faker.seed(7384);

vi.mock(
  '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths',
  () => ({ derivePostPublishPaths: vi.fn() }),
);
vi.mock(
  '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths',
  () => ({ deriveTenantSitePaths: vi.fn() }),
);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_POST_PATHS = [faker.system.directoryPath()];
const MOCK_SITE_PATHS = [faker.system.directoryPath()];
const MOCK_TENANT_INPUT = {
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};
const MOCK_POST_INPUT = {
  ...MOCK_TENANT_INPUT,
  type: POST_TYPE,
  id: faker.string.uuid(),
  slug: MOCK_SLUG,
  operation: SANITY_WEBHOOK_OPERATION.UPDATE,
};

describe(deriveRevalidatePaths, () => {
  beforeEach(() => {
    vi.mocked(derivePostPublishPaths).mockResolvedValue(
      okResult(MOCK_POST_PATHS),
    );
    vi.mocked(deriveTenantSitePaths).mockResolvedValue(
      okResult(MOCK_SITE_PATHS),
    );
  });

  it.each([
    { type: 'settings_navigation', documentHref: undefined },
    { type: 'module_heroBlog', documentHref: undefined },
    { type: 'page_landing', documentHref: `/${MOCK_SLUG}` },
    { type: 'blog_tag', documentHref: undefined },
    { type: 'page_tag', documentHref: `/tags/${MOCK_SLUG}` },
  ])(
    'resolves every page of the tenant for a $type change',
    async ({ type, documentHref }) => {
      const result = await deriveRevalidatePaths({ ...MOCK_POST_INPUT, type });

      expect(result).toEqual(okResult(MOCK_SITE_PATHS));
      expect(deriveTenantSitePaths).toHaveBeenCalledWith({
        ...MOCK_TENANT_INPUT,
        documentHref,
      });
      expect(derivePostPublishPaths).not.toHaveBeenCalled();
    },
  );

  it('resolves a live post’s own paths', async () => {
    const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

    expect(result).toEqual(okResult(MOCK_POST_PATHS));
    expect(deriveTenantSitePaths).not.toHaveBeenCalled();
  });

  it('reports fetch_failed when the post lookup fails', async () => {
    vi.mocked(derivePostPublishPaths).mockResolvedValue(
      errorResult(FETCH_FAILED_REASON),
    );

    const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

    expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
    expect(deriveTenantSitePaths).not.toHaveBeenCalled();
  });

  it.each([
    { type: 'redirect', operation: SANITY_WEBHOOK_OPERATION.UPDATE },
    { type: 'module_postList', operation: SANITY_WEBHOOK_OPERATION.UPDATE },
    { type: 'page_landing', operation: SANITY_WEBHOOK_OPERATION.DELETE },
    { type: 'blog_tag', operation: SANITY_WEBHOOK_OPERATION.DELETE },
  ])(
    'reports path_underivable for a $type $operation',
    async ({ type, operation }) => {
      const result = await deriveRevalidatePaths({
        ...MOCK_POST_INPUT,
        type,
        operation,
      });

      expect(result).toEqual(errorResult(PATH_UNDERIVABLE_REASON));
      expect(deriveTenantSitePaths).not.toHaveBeenCalled();
    },
  );

  describe('when the post is gone', () => {
    beforeEach(() => {
      vi.mocked(derivePostPublishPaths).mockResolvedValue(
        errorResult(DOCUMENT_NOT_FOUND_REASON),
      );
    });

    it('resolves every tenant page and the post’s own path', async () => {
      const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

      expect(result).toEqual(okResult(MOCK_SITE_PATHS));
      expect(deriveTenantSitePaths).toHaveBeenCalledWith({
        ...MOCK_TENANT_INPUT,
        documentHref: `/blog/${MOCK_SLUG}`,
      });
    });

    it('still resolves the tenant’s pages on a delete', async () => {
      const result = await deriveRevalidatePaths({
        ...MOCK_POST_INPUT,
        operation: SANITY_WEBHOOK_OPERATION.DELETE,
      });

      expect(result).toEqual(okResult(MOCK_SITE_PATHS));
    });
  });
});
