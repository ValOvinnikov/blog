import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TTopicDetailPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import {
  MOCK_CTA_HEADING,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  mockTopic,
  mockTopicDetailPage,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TopicPage } from './topic-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { topic: { v1: { getTopicPage: vi.fn() } } },
    entities: { topics: { v1: { getTopics: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getTopicPageMock = vi.mocked(service.pages.topic.v1.getTopicPage);

const TOPIC_SLUG = 'news';

const setup = customRenderServerAsync(TopicPage, {
  slug: TOPIC_SLUG,
});

const NEWS_TOPIC = mockTopic({ title: 'News', slug: TOPIC_SLUG });

const resolveTopicPageWith = (overrides: Partial<TTopicDetailPage>) =>
  getTopicPageMock.mockResolvedValueOnce(
    okResult(mockTopicDetailPage({ topic: NEWS_TOPIC, ...overrides })),
  );

const SUPPORTING_TEXT = 'The latest updates.';
const ARIA_CURRENT = 'aria-current';
const HERO_HEADING = 'All about news';

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockResolvedValue(
      okResult(
        mockTopicDetailPage({
          topic: NEWS_TOPIC,
          headingBlock: mockHeadingBlock({
            heading: 'News',
            supportingText: SUPPORTING_TEXT,
          }),
        }),
      ),
    );
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      okResult([
        mockTopicWithPostCount({ title: 'News', slug: TOPIC_SLUG }),
        mockTopicWithPostCount({
          id: 'topic-2',
          title: 'Design',
          slug: 'design',
        }),
      ]),
    );
  });

  describe('with the default topic', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the topic for the given slug with the tenant context', () => {
      expect(getTopicPageMock).toHaveBeenCalledWith(
        TOPIC_SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the topic heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: 'News',
      });
      const supportingText = within(main).getByText(SUPPORTING_TEXT);
      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: 'Northwind Journal',
      });
      const currentCrumb = within(breadcrumbs).getByText('News');
      const main = screen.getByRole('main');
      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('marks the current topic chip inside main', () => {
      const main = screen.getByRole('main');
      const chips = within(main).getByRole('navigation', { name: 'Topics' });
      const newsChip = within(chips).getByRole('link', { name: 'News' });
      const designChip = within(chips).getByRole('link', { name: 'Design' });
      expect(newsChip).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(designChip).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('renders no FAQPage JSON-LD when the page has no FAQ questions', () => {
      const scripts = screen.queryAllByTestId(JSON_LD_SCRIPT_TEST_ID);
      expect(
        scripts.some((script) =>
          script.textContent?.includes(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT),
        ),
      ).toBe(false);
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTopicPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('topic_page.fetch_failed', {
      slug: TOPIC_SLUG,
      error: MOCK_ERROR,
    });
  });

  it('calls notFound() without logging when the topic does not exist', async () => {
    getTopicPageMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('renders the authored modules inside main', async () => {
    resolveTopicPageWith({
      modules: [{ id: 'cta-1', type: 'module_cta' }],
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce(
      okResult(
        mockCtaModuleData({
          headingBlock: mockHeadingBlock({ heading: MOCK_CTA_HEADING }),
        }),
      ),
    );

    await setup();

    const main = screen.getByRole('main');
    const ctaRegion = within(main).getByRole('region', {
      name: MOCK_CTA_HEADING,
    });
    expect(ctaRegion).toBeVisible();
  });

  it('renders the hero in place of the topic heading when one is set', async () => {
    resolveTopicPageWith({
      headingBlock: mockHeadingBlock({ heading: 'News' }),
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
      name: 'News',
    });
    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it.each([
    { page: 3, expected: 3 },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the topic archive',
    async ({ page, expected }) => {
      resolveTopicPageWith({
        modules: [{ id: 'list-1', type: 'module_postList' }],
      });
      vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
        errorResult(MOCK_ERROR),
      );

      await expect(setup({ page })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
        'list-1',
        MOCK_TENANT_SANITY_CONTEXT,
        expected,
        { termId: 'topic-1' },
      );
    },
  );

  it('names the topic in an empty post list', async () => {
    resolveTopicPageWith({
      modules: [{ id: 'list-1', type: 'module_postList' }],
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
      okResult(mockPostListModuleData()),
    );

    await setup();

    const emptyState = screen.getByText('No posts in News yet.');
    expect(emptyState).toBeVisible();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolveTopicPageWith({
      faqs: [
        {
          id: 'faq-1',
          question: 'Do you offer a free trial?',
          answer: 'Yes.',
        },
      ],
    });

    await setup();

    const scripts = screen.getAllByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(
      scripts.some((script) =>
        script.textContent?.includes(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT),
      ),
    ).toBe(true);
  });
});
