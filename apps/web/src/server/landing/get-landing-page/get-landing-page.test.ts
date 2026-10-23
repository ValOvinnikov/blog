import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getLandingPage } from './get-landing-page';

const PAGE_PATH = 'about-us';

const { getPageMock } = vi.hoisted(() => ({ getPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { landing: { v1: { getPage: getPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getLandingPage, () => {
  beforeEach(() => {
    getPageMock.mockReset();
  });

  it('forwards the path segments and tenant context to the landing page service', async () => {
    getPageMock.mockResolvedValue(okResult());

    await getLandingPage('modules/faq');

    expect(getPageMock).toHaveBeenCalledWith(
      ['modules', 'faq'],
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getPage unchanged', async () => {
    const result = okResult({ title: 'About Us' });
    getPageMock.mockResolvedValue(result);

    await expect(getLandingPage(PAGE_PATH)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the page query across one render pass with the same arguments', async () => {
      getPageMock.mockResolvedValue(okResult());

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getLandingPage: freshGetLandingPage } =
        await import('./get-landing-page');

      await freshGetLandingPage(PAGE_PATH);
      await freshGetLandingPage(PAGE_PATH);

      expect(getPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
