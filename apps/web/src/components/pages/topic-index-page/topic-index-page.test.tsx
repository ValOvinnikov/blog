import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import { service, type TTopicIndexPage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { makeCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { makeHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_TENANT_SANITY_CONTEXT,
  DEFAULT_REQUEST_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { TopicIndexPage } from './topic-index-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: { topicIndex: { v1: { getIndexPage: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
    },
  },
}));

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.topicIndex.v1.getIndexPage);

const topicIndexPage: TTopicIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: makeHeadingBlock({
    heading: 'Topics',
    supportingText: 'Browse every post by topic.',
  }),
  hero: undefined,
  modules: [],
  seo: makeSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

const setup = customRenderServerAsync(TopicIndexPage, {});

describe(`<${TopicIndexPage.name}/>`, () => {
  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the index page with the request context Sanity context', () => {
      expect(getIndexPageMock).toHaveBeenCalledWith(
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      expect(
        within(main).getByRole('heading', { level: 1, name: 'Topics' }),
      ).toBeVisible();
      expect(
        within(main).getByText('Browse every post by topic.'),
      ).toBeVisible();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      expect(
        within(breadcrumbs).getByRole('link', { name: 'Home' }),
      ).toBeVisible();
      expect(within(breadcrumbs).getByText('Topics')).toBeVisible();
      expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
    });
  });

  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getIndexPageMock.mockResolvedValue({ ok: true, data: topicIndexPage });
    vi.mocked(service.modules.cta.v1.getCta).mockImplementation(async (id) => ({
      ok: true,
      data: makeCtaModuleData({
        headingBlock: makeHeadingBlock({
          heading: id === 'cta-1' ? 'Join the list' : 'Write for us',
        }),
      }),
    }));
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'topic_index_page.fetch_failed',
      expect.anything(),
    );
  });

  it('calls notFound() without logging when the index page does not exist', async () => {
    getIndexPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('redirects to / when this language has no topic index page of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getIndexPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the authored modules inside main in order', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...topicIndexPage,
        modules: [
          { id: 'cta-1', type: 'module_cta' },
          { id: 'cta-2', type: 'module_cta' },
        ],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(within(main).getAllByRole('region')).toEqual([
      within(main).getByRole('region', { name: 'Join the list' }),
      within(main).getByRole('region', { name: 'Write for us' }),
    ]);
  });

  it('renders the hero in place of the heading when one is set', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...topicIndexPage,
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'Every topic we write about' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Every topic we write about',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Topics' }),
    ).not.toBeInTheDocument();
  });
});
