import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
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
  beforeEach(() => {
    getIndexPageMock.mockReset();
  });

  it('forwards the resolved tenant context to the topic index service', async () => {
    getIndexPageMock.mockResolvedValue(okResult());

    await getTopicIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the raw TResult from getIndexPage unchanged', async () => {
    const result = okResult({ heading: 'Topics' });
    getIndexPageMock.mockResolvedValue(result);

    await expect(getTopicIndexPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the index-page query across one render pass with the same arguments', async () => {
      getIndexPageMock.mockResolvedValue(okResult());

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getTopicIndexPage: freshGetTopicIndexPage } =
        await import('./get-topic-index-page');

      await freshGetTopicIndexPage();
      await freshGetTopicIndexPage();

      expect(getIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
