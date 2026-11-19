import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@shinefold/config';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config/constants';
import { service } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_NAME,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { TopicIndexPage } from './topic-index-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: { topicIndex: { v1: { getIndexPage: vi.fn() } } },
  },
}));

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.topicIndex.v1.getIndexPage);

const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_INDEX_PAGE = mockIndexPage({
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
});

const setup = customRenderServerAsync(TopicIndexPage, {});

describe(`<${TopicIndexPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockReset();
    getIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
  });

  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the index page with the tenant context', () => {
      expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
    });

    it('renders the breadcrumb trail', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_TENANT_NAME,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_PAGE_HEADING);

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
    });
  });

  it('logs and throws to the error boundary when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toBe(MOCK_ERROR);

    expect(logger.error).toHaveBeenCalledWith(
      TOPIC_INDEX_LOG.PAGE_FETCH_FAILED,
      {
        error: MOCK_ERROR,
      },
    );
  });

  it('redirects to / when this language has no topic index page', async () => {
    getIndexPageMock.mockResolvedValueOnce(okResult());
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });
});
