import { service, type TBlogIndexPage } from '@blog/service';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { makeCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { makeHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { PostIndexPage } from './post-index-page';

vi.mock('@web/server/request-context/request-context');

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

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.blog.v1.getIndexPage);

const indexPage: TBlogIndexPage = {
  headingBlock: makeHeadingBlock({
    heading: 'Blog',
    supportingText: 'Notes from the team.',
  }),
  hero: undefined,
  modules: [],
  seo: makeSeo(),
};

const setup = customRenderServerAsync(PostIndexPage, {
  page: 1,
});

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    getIndexPageMock.mockResolvedValue({ ok: true, data: indexPage });
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue({
      ok: true,
      data: [
        makeTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
      ],
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'post_index_page.fetch_failed',
      expect.anything(),
    );
  });

  it('calls notFound() without logging when the index page does not exist', async () => {
    getIndexPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('fetches the index page with the tenant context', async () => {
    await setup();

    expect(getIndexPageMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the page heading and supporting text inside main', async () => {
    await setup();

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(within(main).getByText('Notes from the team.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the breadcrumb trail outside main', async () => {
    await setup();

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumbs).getByRole('link', { name: 'Home' }),
    ).toBeVisible();
    expect(within(breadcrumbs).getByText('Blog')).toBeVisible();
    expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
  });

  it('renders the tenant topic chips inside main', async () => {
    await setup();

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

  it('renders the authored modules inside main', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: { ...indexPage, modules: [{ id: 'cta-1', type: 'module_cta' }] },
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

  it('renders the hero in place of the page heading when one is set', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: { ...indexPage, hero: { id: 'hero-1', type: 'module_heroBlog' } },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'Everything we write' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Everything we write' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Blog' }),
    ).not.toBeInTheDocument();
  });

  it('loads post lists for the current page with no archive scope', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...indexPage,
        modules: [{ id: 'list-1', type: 'module_postList' }],
      },
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup({ page: 2 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
      'list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      2,
      undefined,
    );
  });
});
