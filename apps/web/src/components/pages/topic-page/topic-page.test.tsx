import { service } from '@blog/service';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { makeCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { makeHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { makePostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  makeTopic,
  makeTopicDetailPage,
  makeTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TopicPage } from './topic-page';

vi.mock('@web/server/request-context/request-context');

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

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getTopicPageMock = vi.mocked(service.pages.topic.v1.getTopicPage);

const FAQ_PAGE_JSON_LD = '"@type":"FAQPage"';

const setup = customRenderServerAsync(TopicPage, {
  slug: 'news',
});

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: makeTopicDetailPage({
        topic: makeTopic({ title: 'News', slug: 'news' }),
        headingBlock: makeHeadingBlock({
          heading: 'News',
          supportingText: 'The latest updates.',
        }),
      }),
    });
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue({
      ok: true,
      data: [
        makeTopicWithPostCount({ title: 'News', slug: 'news' }),
        makeTopicWithPostCount({
          id: 'topic-2',
          title: 'Design',
          slug: 'design',
        }),
      ],
    });
  });

  describe('with the default topic', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the topic for the given slug with the tenant context', () => {
      expect(getTopicPageMock).toHaveBeenCalledWith(
        'news',
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the topic heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      expect(
        within(main).getByRole('heading', { level: 1, name: 'News' }),
      ).toBeVisible();
      expect(within(main).getByText('The latest updates.')).toBeVisible();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      expect(
        within(breadcrumbs).getByRole('link', { name: 'Home' }),
      ).toBeVisible();
      expect(within(breadcrumbs).getByText('News')).toBeVisible();
      expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
    });

    it('renders the topic chips inside main with the current topic active', () => {
      const chips = within(screen.getByRole('main')).getByRole('navigation', {
        name: 'Topics',
      });
      expect(within(chips).getByRole('link', { name: 'News' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        within(chips).getByRole('link', { name: 'Design' }),
      ).not.toHaveAttribute('aria-current');
    });

    it('renders no FAQPage JSON-LD when the page has no FAQ questions', () => {
      expect(
        screen
          .queryAllByTestId('json-ld-script')
          .some((script) => script.textContent?.includes(FAQ_PAGE_JSON_LD)),
      ).toBe(false);
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTopicPageMock.mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'topic_page.fetch_failed',
      expect.objectContaining({ slug: 'news' }),
    );
  });

  it('calls notFound() without logging when the topic does not exist', async () => {
    getTopicPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('renders the authored modules inside main', async () => {
    getTopicPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTopicDetailPage({
        topic: makeTopic({ title: 'News', slug: 'news' }),
        modules: [{ id: 'cta-1', type: 'module_cta' }],
      }),
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce({
      ok: true,
      data: makeCtaModuleData({
        headingBlock: makeHeadingBlock({ heading: 'Join the list' }),
      }),
    });

    await setup();

    expect(
      within(screen.getByRole('main')).getByRole('region', {
        name: 'Join the list',
      }),
    ).toBeVisible();
  });

  it('renders the hero in place of the topic heading when one is set', async () => {
    getTopicPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTopicDetailPage({
        topic: makeTopic({ title: 'News', slug: 'news' }),
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      }),
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'All about news' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'All about news' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'News' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    { page: 3, expected: 3 },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the topic archive',
    async ({ page, expected }) => {
      getTopicPageMock.mockResolvedValueOnce({
        ok: true,
        data: makeTopicDetailPage({
          topic: makeTopic({ title: 'News', slug: 'news' }),
          modules: [{ id: 'list-1', type: 'module_postList' }],
        }),
      });
      vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce({
        ok: false,
        error: new Error('boom'),
      });

      await expect(setup({ page })).rejects.toThrow('NEXT_NOT_FOUND');

      expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
        'list-1',
        DEFAULT_TENANT_SANITY_CONTEXT,
        expected,
        { termId: 'topic-1' },
      );
    },
  );

  it('names the topic in an empty post list', async () => {
    getTopicPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTopicDetailPage({
        topic: makeTopic({ title: 'News', slug: 'news' }),
        modules: [{ id: 'list-1', type: 'module_postList' }],
      }),
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce({
      ok: true,
      data: makePostListModuleData(),
    });

    await setup();

    expect(screen.getByText('No posts in News yet.')).toBeVisible();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    getTopicPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTopicDetailPage({
        topic: makeTopic({ title: 'News', slug: 'news' }),
        faqs: [
          {
            id: 'faq-1',
            question: 'Do you offer a free trial?',
            answer: 'Yes.',
          },
        ],
      }),
    });

    await setup();

    expect(
      screen
        .getAllByTestId('json-ld-script')
        .some((script) => script.textContent?.includes(FAQ_PAGE_JSON_LD)),
    ).toBe(true);
  });
});
