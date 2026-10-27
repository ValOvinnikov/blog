import { SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TTagDetailPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_FAQ_PAGE_JSON_LD_FRAGMENT,
  mockFaqPageQuestion,
} from '@web/testing/shared/json-ld/fixtures';
import { readJsonLd } from '@web/testing/shared/json-ld/read-json-ld';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { mockTag, mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: vi.fn() } } },
    modules: {
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getTagPageMock = vi.mocked(service.pages.tag.v1.getTagPage);
const getHeroBlogMock = vi.mocked(service.modules.heroBlog.v1.getHeroBlog);
const getPostListMock = vi.mocked(service.modules.postList.v1.getPostList);

const MOCK_TAG_SLUG = faker.lorem.slug();
const MOCK_TAG = mockTag({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: MOCK_TAG_SLUG,
});
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_HERO_HEADING = faker.lorem.words(3);
const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_PAGE_NUMBER = faker.number.int({ min: 2, max: 9 });

const resolveTagPageWith = (overrides: Partial<TTagDetailPage>) =>
  getTagPageMock.mockResolvedValueOnce(
    okResult(mockTagDetailPage({ tag: MOCK_TAG, ...overrides })),
  );

const setup = customRenderServerAsync(TagPage, {
  slug: MOCK_TAG_SLUG,
});

describe(`<${TagPage.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockResolvedValue(
      okResult(
        mockTagDetailPage({
          tag: MOCK_TAG,
          headingBlock: mockHeadingBlock({
            heading: MOCK_PAGE_HEADING,
            supportingText: MOCK_SUPPORTING_TEXT,
          }),
        }),
      ),
    );
  });

  describe('with the default tag', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the tag for the given slug with the tenant context', () => {
      expect(getTagPageMock).toHaveBeenCalledWith(
        MOCK_TAG_SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the tag heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: MOCK_PAGE_HEADING,
      });
      const supportingText = within(main).getByText(MOCK_SUPPORTING_TEXT);

      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_SITE_SETTINGS.brand.name,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_TAG.title);
      const main = screen.getByRole('main');

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTagPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('tag_page.fetch_failed', {
      slug: MOCK_TAG_SLUG,
      error: MOCK_ERROR,
    });
  });

  it.each([
    { page: MOCK_PAGE_NUMBER, expected: MOCK_PAGE_NUMBER },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the tag archive',
    async ({ page, expected }) => {
      resolveTagPageWith({
        modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
      });
      getPostListMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

      await expect(setup({ page })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(getPostListMock).toHaveBeenCalledWith(
        MOCK_POST_LIST_ID,
        MOCK_TENANT_SANITY_CONTEXT,
        expected,
        { termId: MOCK_TAG.id },
      );
    },
  );

  it('names the tag in an empty post list', async () => {
    resolveTagPageWith({
      modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
    });
    getPostListMock.mockResolvedValueOnce(okResult(mockPostListModuleData()));

    await setup();

    const emptyState = screen.getByText(
      SITE_MESSAGES.tagPage.empty.replace('{name}', MOCK_TAG.title),
    );

    expect(emptyState).toBeVisible();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolveTagPageWith({ faqs: [mockFaqPageQuestion()] });

    await setup();

    expect(readJsonLd()).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });

  it('renders the hero in place of the heading when one is set', async () => {
    resolveTagPageWith({ hero: { id: MOCK_HERO_ID, type: 'module_heroBlog' } });
    getHeroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: MOCK_HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: MOCK_PAGE_HEADING,
    });

    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
});
