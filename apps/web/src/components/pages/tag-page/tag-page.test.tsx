import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { service, type TTagDetailPage } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { TAG_LOG } from '@web/constants/tag';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { mockTag, mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { TagPage } from './tag-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: vi.fn() } } },
    modules: {
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getTagPageMock = vi.mocked(service.pages.tag.v1.getTagPage);
const getPostListMock = vi.mocked(service.modules.postList.v1.getPostList);

const MOCK_TAG_SLUG = faker.lorem.slug();
const MOCK_TAG = mockTag({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: MOCK_TAG_SLUG,
});

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
      okResult(mockTagDetailPage({ tag: MOCK_TAG })),
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

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_TENANT_NAME,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_TAG.title);
      const main = screen.getByRole('main');

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });
  });

  it('logs and throws to the error boundary when the fetch fails', async () => {
    getTagPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toBe(MOCK_ERROR);

    expect(logger.error).toHaveBeenCalledWith(TAG_LOG.PAGE_FETCH_FAILED, {
      slug: MOCK_TAG_SLUG,
      error: MOCK_ERROR,
    });
  });

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
});
