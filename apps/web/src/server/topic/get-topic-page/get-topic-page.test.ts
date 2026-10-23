import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTopicPage } from './get-topic-page';

const TOPIC_SLUG = 'engineering';

const { getTopicPageMock } = vi.hoisted(() => ({ getTopicPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { topic: { v1: { getTopicPage: getTopicPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTopicPage, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
  });

  it('forwards the slug and the resolved tenant context to the topic page service', async () => {
    getTopicPageMock.mockResolvedValue(okResult());

    await getTopicPage(TOPIC_SLUG);

    expect(getTopicPageMock).toHaveBeenCalledWith(
      TOPIC_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getTopicPage unchanged', async () => {
    const result = okResult({ topic: { title: 'Engineering' } });
    getTopicPageMock.mockResolvedValue(result);

    await expect(getTopicPage(TOPIC_SLUG)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the topic-page query across one render pass with the same arguments', async () => {
      getTopicPageMock.mockResolvedValue(okResult());

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getTopicPage: freshGetTopicPage } =
        await import('./get-topic-page');

      await freshGetTopicPage(TOPIC_SLUG);
      await freshGetTopicPage(TOPIC_SLUG);

      expect(getTopicPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
