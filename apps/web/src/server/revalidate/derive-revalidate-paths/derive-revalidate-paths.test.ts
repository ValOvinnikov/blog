import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, SANITY_WEBHOOK_OPERATION } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
} from '@web/constants/revalidate';
import { derivePostPublishPaths } from '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { deriveRevalidatePaths, POST_TYPE } from './derive-revalidate-paths';

faker.seed(7384);

const { UPDATE, DELETE } = SANITY_WEBHOOK_OPERATION;

vi.mock(
  '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths',
  () => ({ derivePostPublishPaths: vi.fn() }),
);
vi.mock(
  '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths',
  () => ({ deriveTenantSitePaths: vi.fn() }),
);

const [MOCK_SLUG, MOCK_PREVIOUS_SLUG] = faker.helpers.uniqueArray(
  faker.lorem.slug,
  2,
) as [string, string];
const MOCK_SOURCE = `/${faker.lorem.slug()}`;
const MOCK_LANGUAGE = LOCALE_ISO_CODES.NL;
const MOCK_POST_PATHS = [faker.system.directoryPath()];
const MOCK_SITE_PATHS = [faker.system.directoryPath()];
const MOCK_TENANT_INPUT = {
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};
const MOCK_SITE_INPUT = { ...MOCK_TENANT_INPUT, localizedDocumentPaths: [] };
const MOCK_POST_INPUT = {
  ...MOCK_TENANT_INPUT,
  type: POST_TYPE,
  id: faker.string.uuid(),
  slug: MOCK_SLUG,
  previousSlug: undefined,
  operation: UPDATE,
  redirect: {},
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
    { type: 'settings_navigation', operation: UPDATE, documentHref: undefined },
    { type: 'module_heroBlog', operation: UPDATE, documentHref: undefined },
    { type: 'page_landing', operation: UPDATE, documentHref: `/${MOCK_SLUG}` },
    { type: 'blog_tag', operation: UPDATE, documentHref: undefined },
    { type: 'page_tag', operation: UPDATE, documentHref: `/tags/${MOCK_SLUG}` },
    { type: 'redirect', operation: UPDATE, documentHref: undefined },
    { type: 'module_postList', operation: UPDATE, documentHref: undefined },
    { type: 'page_landing', operation: DELETE, documentHref: `/${MOCK_SLUG}` },
    { type: 'blog_tag', operation: DELETE, documentHref: undefined },
  ])(
    'resolves every page of the tenant for a $type $operation',
    async ({ type, operation, documentHref }) => {
      const result = await deriveRevalidatePaths({
        ...MOCK_POST_INPUT,
        type,
        operation,
      });

      expect(result).toEqual(okResult(MOCK_SITE_PATHS));
      expect(deriveTenantSitePaths).toHaveBeenCalledWith({
        ...MOCK_SITE_INPUT,
        documentHref,
      });
      expect(derivePostPublishPaths).not.toHaveBeenCalled();
    },
  );

  it('hands a renamed document to the tenant page derivation', async () => {
    await deriveRevalidatePaths({
      ...MOCK_POST_INPUT,
      type: 'page_topic',
      previousSlug: MOCK_PREVIOUS_SLUG,
    });

    expect(deriveTenantSitePaths).toHaveBeenCalledWith({
      ...MOCK_SITE_INPUT,
      documentHref: `/topics/${MOCK_SLUG}`,
      renamedDocument: {
        type: 'page_topic',
        slug: MOCK_SLUG,
        previousSlug: MOCK_PREVIOUS_SLUG,
      },
    });
  });

  it.each([
    { case: 'an unchanged slug', previousSlug: MOCK_SLUG },
    { case: 'no previous slug', previousSlug: undefined },
  ])('reports no renamed document for $case', async ({ previousSlug }) => {
    await deriveRevalidatePaths({
      ...MOCK_POST_INPUT,
      type: 'page_topic',
      previousSlug,
    });

    expect(deriveTenantSitePaths).toHaveBeenCalledWith(
      expect.objectContaining({ renamedDocument: undefined }),
    );
  });

  it('hands a renamed post’s previous slug to the post derivation', async () => {
    await deriveRevalidatePaths({
      ...MOCK_POST_INPUT,
      previousSlug: MOCK_PREVIOUS_SLUG,
    });

    expect(derivePostPublishPaths).toHaveBeenCalledWith({
      ...MOCK_TENANT_INPUT,
      id: MOCK_POST_INPUT.id,
      previousSlug: MOCK_PREVIOUS_SLUG,
    });
  });

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

  it('hands a redirect’s addresses in its language to the tenant page derivation', async () => {
    await deriveRevalidatePaths({
      ...MOCK_POST_INPUT,
      type: 'redirect',
      slug: undefined,
      redirect: { source: MOCK_SOURCE, language: MOCK_LANGUAGE },
    });

    expect(deriveTenantSitePaths).toHaveBeenCalledWith({
      ...MOCK_TENANT_INPUT,
      localizedDocumentPaths: [{ language: MOCK_LANGUAGE, path: MOCK_SOURCE }],
    });
  });

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
        ...MOCK_SITE_INPUT,
        documentHref: `/blog/${MOCK_SLUG}`,
      });
    });

    it('hands a renamed post to the tenant page derivation', async () => {
      await deriveRevalidatePaths({
        ...MOCK_POST_INPUT,
        previousSlug: MOCK_PREVIOUS_SLUG,
      });

      expect(deriveTenantSitePaths).toHaveBeenCalledWith({
        ...MOCK_SITE_INPUT,
        documentHref: `/blog/${MOCK_SLUG}`,
        renamedDocument: {
          type: POST_TYPE,
          slug: MOCK_SLUG,
          previousSlug: MOCK_PREVIOUS_SLUG,
        },
      });
    });

    it('still resolves the tenant’s pages on a delete', async () => {
      const result = await deriveRevalidatePaths({
        ...MOCK_POST_INPUT,
        operation: DELETE,
      });

      expect(result).toEqual(okResult(MOCK_SITE_PATHS));
    });
  });
});
