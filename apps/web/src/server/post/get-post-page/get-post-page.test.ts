import { faker } from '@faker-js/faker';
import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostPage } from './get-post-page';

faker.seed(6010);

const MOCK_POST_SLUG = faker.lorem.slug();

const { getPostMock } = vi.hoisted(() => ({ getPostMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { post: { v1: { getPost: getPostMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getPostPage, () => {
  it('loads the post by slug for the resolved tenant', async () => {
    getPostMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getPostPage(MOCK_POST_SLUG);

    expect(getPostMock).toHaveBeenCalledWith(
      MOCK_POST_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getPostMock.mockResolvedValueOnce(result);

    await expect(getPostPage(MOCK_POST_SLUG)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass for the same slug', async () => {
      getPostMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getPostPage: memoizedGetPostPage } =
        await importWithMemoizingCache(() => import('./get-post-page'));

      await memoizedGetPostPage(MOCK_POST_SLUG);
      await memoizedGetPostPage(MOCK_POST_SLUG);

      expect(getPostMock).toHaveBeenCalledTimes(1);
    });
  });
});
