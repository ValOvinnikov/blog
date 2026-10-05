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
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getTagPageMock = vi.mocked(service.pages.tag.v1.getTagPage);

const setup = customRenderServerAsync(TagPage, {
  slug: 'typescript',
});

describe(`<${TagPage.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({
        headingBlock: makeHeadingBlock({
          heading: 'TypeScript',
          supportingText: 'Posts about TypeScript.',
        }),
      }),
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTagPageMock.mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'tag_page.fetch_failed',
      expect.objectContaining({ slug: 'typescript' }),
    );
  });

  it('calls notFound() without logging when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('fetches the tag for the given slug with the tenant context', async () => {
    await setup();

    expect(getTagPageMock).toHaveBeenCalledWith(
      'typescript',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the tag heading and supporting text inside main', async () => {
    await setup();

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(within(main).getByText('Posts about TypeScript.')).toBeVisible();
  });

  it('renders the breadcrumb trail outside main', async () => {
    await setup();

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumbs).getByRole('link', { name: 'Home' }),
    ).toBeVisible();
    expect(within(breadcrumbs).getByText('TypeScript')).toBeVisible();
    expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
  });

  it('renders the authored modules inside main', async () => {
    getTagPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTagDetailPage({
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

  it('renders the hero in place of the tag heading when one is set', async () => {
    getTagPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTagDetailPage({
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      }),
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'All about TypeScript' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'All about TypeScript' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    { page: 3, expected: 3 },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the tag archive',
    async ({ page, expected }) => {
      getTagPageMock.mockResolvedValueOnce({
        ok: true,
        data: makeTagDetailPage({
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
        { termId: 'tag-1' },
      );
    },
  );

  it('names the tag in an empty post list', async () => {
    getTagPageMock.mockResolvedValueOnce({
      ok: true,
      data: makeTagDetailPage({
        modules: [{ id: 'list-1', type: 'module_postList' }],
      }),
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce({
      ok: true,
      data: makePostListModuleData(),
    });

    await setup();

    expect(screen.getByText('No posts tagged TypeScript yet.')).toBeVisible();
  });
});
