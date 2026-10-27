import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTopicIndexPage } from './get-topic-index-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: {
    pages: { topicIndex: { v1: { getIndexPage: getIndexPageMock } } },
  },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTopicIndexPage, () => {
  it('loads the topic index for the resolved tenant', async () => {
    getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getTopicIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getIndexPageMock.mockResolvedValueOnce(result);

    await expect(getTopicIndexPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass', async () => {
      getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getTopicIndexPage: memoizedGetTopicIndexPage } =
        await importWithMemoizingCache(() => import('./get-topic-index-page'));

      await memoizedGetTopicIndexPage();
      await memoizedGetTopicIndexPage();

      expect(getIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
