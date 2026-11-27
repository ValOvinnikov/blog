import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { service } from '@shinefold/service';
import { TAG_LOG } from '@web/constants/tag';
import { customRenderServerAsync } from '@web/testing/custom-render';
import { testNamesTermInEmptyPostList } from '@web/testing/pages/empty-post-list-contract/empty-post-list-contract';
import { testLoadedPageContract } from '@web/testing/pages/loaded-page-contract/loaded-page-contract';
import { mockTag, mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TagPage } from './tag-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: vi.fn() } } },
    modules: {
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

const getTagPageMock = vi.mocked(service.pages.tag.v1.getTagPage);

const MOCK_TAG_SLUG = faker.lorem.slug();
const MOCK_TAG = mockTag({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: MOCK_TAG_SLUG,
});

const MOCK_TAG_PAGE = mockTagDetailPage({ tag: MOCK_TAG });

const setup = customRenderServerAsync(TagPage, {
  slug: MOCK_TAG_SLUG,
});

describe(`<${TagPage.name}/>`, () => {
  testLoadedPageContract({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_TAG_PAGE,
    loaderArgs: [MOCK_TAG_SLUG, MOCK_TENANT_SANITY_CONTEXT],
    logEvent: TAG_LOG.PAGE_FETCH_FAILED,
    logContext: { slug: MOCK_TAG_SLUG },
    currentCrumb: MOCK_TAG.title,
  });

  testNamesTermInEmptyPostList({
    pageLoaderMock: getTagPageMock,
    postListMock: vi.mocked(service.modules.postList.v1.getPostList),
    setup,
    successData: MOCK_TAG_PAGE,
    emptyState: SITE_MESSAGES.tagPage.empty.replace('{name}', MOCK_TAG.title),
  });
});
