import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TBlogIndexPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
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
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { PostIndexPage } from './post-index-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { blog: { v1: { getIndexPage: vi.fn() } } },
    entities: { topics: { v1: { getTopics: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.blog.v1.getIndexPage);

const SUPPORTING_TEXT = 'Notes from the team.';
const CTA_HEADING = 'Join the list';
const HERO_HEADING = 'Everything we write';

const indexPage: TBlogIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: makeHeadingBlock({
    heading: 'Blog',
    supportingText: SUPPORTING_TEXT,
  }),
  hero: undefined,
  modules: [],
  seo: makeSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

const setup = customRenderServerAsync(PostIndexPage, {
  page: 1,
});

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getIndexPageMock.mockResolvedValue(okResult(indexPage));
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      okResult([
        makeTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
      ]),
    );
  });

  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the index page with the tenant context', () => {
      expect(getIndexPageMock).toHaveBeenCalledWith(
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the page heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      expect(
        within(main).getByRole('heading', { level: 1, name: 'Blog' }),
      ).toBeVisible();
      expect(within(main).getByText(SUPPORTING_TEXT)).toBeVisible();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      expect(
        within(breadcrumbs).getByRole('link', { name: 'Northwind Journal' }),
      ).toBeVisible();
      expect(within(breadcrumbs).getByText('Blog')).toBeVisible();
      expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
    });

    it('renders the tenant topic chips inside main', () => {
      const topics = within(screen.getByRole('main')).getByRole('navigation', {
        name: 'Topics',
      });
      expect(
        within(topics).getByRole('link', { name: 'Engineering' }),
      ).toHaveAttribute('href', '/topics/engineering');
      expect(service.entities.topics.v1.getTopics).toHaveBeenCalledWith(
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce(errorResult(new Error('boom')));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'post_index_page.fetch_failed',
      expect.anything(),
    );
  });

  it('calls notFound() without logging when the index page does not exist', async () => {
    getIndexPageMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('redirects to / when this language has no post index page of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getIndexPageMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the authored modules inside main', async () => {
    getIndexPageMock.mockResolvedValueOnce(
      okResult({
        ...indexPage,
        modules: [{ id: 'cta-1', type: 'module_cta' }],
      }),
    );
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce(
      okResult(
        makeCtaModuleData({
          headingBlock: makeHeadingBlock({ heading: CTA_HEADING }),
        }),
      ),
    );

    await setup();

    expect(
      within(screen.getByRole('main')).getByRole('region', {
        name: CTA_HEADING,
      }),
    ).toBeVisible();
  });

  it('renders the hero in place of the page heading when one is set', async () => {
    getIndexPageMock.mockResolvedValueOnce(
      okResult({
        ...indexPage,
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      }),
    );
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce(
      okResult(makeHeroBlogData({ heading: HERO_HEADING })),
    );

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: HERO_HEADING }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Blog' }),
    ).not.toBeInTheDocument();
  });

  it('loads post lists for the current page with no archive scope', async () => {
    getIndexPageMock.mockResolvedValueOnce(
      okResult({
        ...indexPage,
        modules: [{ id: 'list-1', type: 'module_postList' }],
      }),
    );
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
      errorResult(new Error('boom')),
    );

    await expect(setup({ page: 2 })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
      'list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      2,
      undefined,
    );
  });
});
