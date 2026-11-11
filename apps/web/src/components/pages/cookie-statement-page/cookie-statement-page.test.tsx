import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { COOKIE_STATEMENT_LOG } from '@web/constants/cookie-statement';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { mockCookieStatementPage } from '@web/testing/shared/cookie-statement/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { CookieStatementPage } from './cookie-statement-page';

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    pages: { cookieStatement: { v1: { getCookieStatementPage: vi.fn() } } },
  },
}));

const getCookieStatementPageMock = vi.mocked(
  service.pages.cookieStatement.v1.getCookieStatementPage,
);

const MOCK_HEADING_BLOCK = mockHeadingBlock({ heading: 'Cookies we use' });
const MOCK_PAGE = mockCookieStatementPage({ headingBlock: MOCK_HEADING_BLOCK });

const setup = customRenderServerAsync(CookieStatementPage, {});

const expectNotFound = async () => {
  await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
};

describe(`<${CookieStatementPage.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
    getCookieStatementPageMock.mockResolvedValue(okResult(MOCK_PAGE));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the page loads', () => {
    beforeEach(async () => {
      await setup();
    });

    it("loads the tenant's cookie statement", () => {
      expect(getCookieStatementPageMock).toHaveBeenCalledWith(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the heading block as the page heading', () => {
      const heading = screen.getByRole('heading', { level: 1 });

      expect(heading).toHaveTextContent(MOCK_HEADING_BLOCK.heading);
    });

    it('never renders the internal title', () => {
      const title = screen.queryByText(MOCK_PAGE.title);

      expect(title).not.toBeInTheDocument();
    });
  });

  it('calls notFound() without logging when no statement is published', async () => {
    getCookieStatementPageMock.mockResolvedValueOnce(okResult());

    await expectNotFound();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and throws to the error boundary when the fetch fails', async () => {
    getCookieStatementPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toBe(MOCK_ERROR);

    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.PAGE_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
