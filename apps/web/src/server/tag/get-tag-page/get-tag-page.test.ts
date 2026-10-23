import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTagPage } from './get-tag-page';

const TAG_SLUG = 'typescript';

const { getTagPageMock } = vi.hoisted(() => ({ getTagPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { tag: { v1: { getTagPage: getTagPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTagPage, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
  });

  it('forwards the slug and the resolved tenant context to the tag page service', async () => {
    getTagPageMock.mockResolvedValue(okResult());

    await getTagPage(TAG_SLUG);

    expect(getTagPageMock).toHaveBeenCalledWith(
      TAG_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getTagPage unchanged', async () => {
    const result = okResult({ tag: { title: 'TypeScript' } });
    getTagPageMock.mockResolvedValue(result);

    await expect(getTagPage(TAG_SLUG)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the tag-page query across one render pass with the same arguments', async () => {
      getTagPageMock.mockResolvedValue(okResult());

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getTagPage: freshGetTagPage } = await import('./get-tag-page');

      await freshGetTagPage(TAG_SLUG);
      await freshGetTagPage(TAG_SLUG);

      expect(getTagPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
