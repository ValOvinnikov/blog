import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import { service, type TTagIndexPage } from '@blog/service';
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

import { TagIndexPage } from './tag-index-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: { tagIndex: { v1: { getIndexPage: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
    },
  },
}));

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.tagIndex.v1.getIndexPage);

const tagIndexPage: TTagIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: makeHeadingBlock({
    heading: 'Tags',
    supportingText: 'Browse every post by tag.',
  }),
  hero: undefined,
  modules: [],
  seo: makeSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

const setup = customRenderServerAsync(TagIndexPage, {});

describe(`<${TagIndexPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getIndexPageMock.mockResolvedValue({ ok: true, data: tagIndexPage });
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
      'tag_index_page.fetch_failed',
      expect.anything(),
    );
  });

  it('calls notFound() without logging when the index page does not exist', async () => {
    getIndexPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('redirects to / when this language has no tag index page of its own', async () => {
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

  describe('when the index page exists', () => {
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
        within(main).getByRole('heading', { level: 1, name: 'Tags' }),
      ).toBeVisible();
      expect(within(main).getByText('Browse every post by tag.')).toBeVisible();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      expect(
        within(breadcrumbs).getByRole('link', { name: 'Home' }),
      ).toBeVisible();
      expect(within(breadcrumbs).getByText('Tags')).toBeVisible();
      expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
    });
  });

  it('renders the authored modules inside main in order', async () => {
    getIndexPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...tagIndexPage,
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
        ...tagIndexPage,
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'Every tag we write about' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Every tag we write about',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Tags' }),
    ).not.toBeInTheDocument();
  });
});
