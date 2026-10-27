import { faker } from '@faker-js/faker';
import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTopicPage } from './get-topic-page';

faker.seed(6011);

const MOCK_TOPIC_SLUG = faker.lorem.slug();

const { getTopicPageMock } = vi.hoisted(() => ({ getTopicPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { topic: { v1: { getTopicPage: getTopicPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTopicPage, () => {
  it('loads the topic page by slug for the resolved tenant', async () => {
    getTopicPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getTopicPage(MOCK_TOPIC_SLUG);

    expect(getTopicPageMock).toHaveBeenCalledWith(
      MOCK_TOPIC_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getTopicPageMock.mockResolvedValueOnce(result);

    await expect(getTopicPage(MOCK_TOPIC_SLUG)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass for the same slug', async () => {
      getTopicPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getTopicPage: memoizedGetTopicPage } =
        await importWithMemoizingCache(() => import('./get-topic-page'));

      await memoizedGetTopicPage(MOCK_TOPIC_SLUG);
      await memoizedGetTopicPage(MOCK_TOPIC_SLUG);

      expect(getTopicPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
