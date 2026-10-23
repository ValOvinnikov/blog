import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TTopicIndexPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_TENANT_SANITY_CONTEXT,
  DEFAULT_REQUEST_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { TopicIndexPage } from './topic-index-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@blog/service', () => ({
  service: {
    pages: { topicIndex: { v1: { getIndexPage: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.topicIndex.v1.getIndexPage);

const SUPPORTING_TEXT = 'Browse every post by topic.';
const CTA_HEADING = 'Join the list';
const SECOND_CTA_HEADING = 'Write for us';
const HERO_HEADING = 'Every topic we write about';

const topicIndexPage: TTopicIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: makeHeadingBlock({
    heading: 'Topics',
    supportingText: SUPPORTING_TEXT,
  }),
  hero: undefined,
  modules: [],
  seo: mockSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

const resolveIndexPageWith = (overrides: Partial<TTopicIndexPage>) =>
  getIndexPageMock.mockResolvedValueOnce(
    okResult({ ...topicIndexPage, ...overrides }),
  );

const setup = customRenderServerAsync(TopicIndexPage, {});

describe(`<${TopicIndexPage.name}/>`, () => {
  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the index page with the tenant context', () => {
      expect(getIndexPageMock).toHaveBeenCalledWith(
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: 'Topics',
      });
      const supportingText = within(main).getByText(SUPPORTING_TEXT);
      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: 'Northwind Journal',
      });
      const currentCrumb = within(breadcrumbs).getByText('Topics');
      const main = screen.getByRole('main');
      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });
  });

  beforeEach(() => {
    vi.mocked(getRequestContext).mockReset();
    getIndexPageMock.mockResolvedValue(okResult(topicIndexPage));
    vi.mocked(service.modules.cta.v1.getCta).mockImplementation(async (id) =>
      okResult(
        mockCtaModuleData({
          headingBlock: makeHeadingBlock({
            heading: id === 'cta-1' ? CTA_HEADING : SECOND_CTA_HEADING,
          }),
        }),
      ),
    );
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('topic_index_page.fetch_failed', {
      error: MOCK_ERROR,
    });
  });

  describe('when there is no index page', () => {
    beforeEach(() => {
      getIndexPageMock.mockResolvedValueOnce(okResult());
    });

    it('calls notFound() without logging when there is no index page', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('redirects to / when this language has no topic index page', async () => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...DEFAULT_REQUEST_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });
  });

  it('renders the authored modules inside main in order', async () => {
    resolveIndexPageWith({
      modules: [
        { id: 'cta-1', type: 'module_cta' },
        { id: 'cta-2', type: 'module_cta' },
      ],
    });

    await setup();

    const main = screen.getByRole('main');
    const regions = within(main).getAllByRole('region');
    const ctaRegion = within(main).getByRole('region', { name: CTA_HEADING });
    const secondCtaRegion = within(main).getByRole('region', {
      name: SECOND_CTA_HEADING,
    });
    expect(regions).toEqual([ctaRegion, secondCtaRegion]);
  });

  it('renders the hero in place of the heading when one is set', async () => {
    resolveIndexPageWith({
      hero: { id: 'hero-1', type: 'module_heroBlog' },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: 'Topics',
    });
    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
});
