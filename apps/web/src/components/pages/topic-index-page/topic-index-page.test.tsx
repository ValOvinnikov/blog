import { faker } from '@faker-js/faker';
import { service } from '@shinefold/service';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { customRenderServerAsync } from '@web/testing/custom-render';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import {
  testLoadedPageContract,
  testRedirectsMissingLanguagePage,
} from '@web/testing/pages/loaded-page-contract/loaded-page-contract';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TopicIndexPage } from './topic-index-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/site-config/get-brand-name/get-brand-name');
vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');
vi.mock('@web/i18n/navigation');

vi.mock('@shinefold/service', () => ({
  service: { pages: { topicIndex: { v1: { getIndexPage: vi.fn() } } } },
}));

const pageLoaderMock = vi.mocked(service.pages.topicIndex.v1.getIndexPage);
const MOCK_INDEX_PAGE = mockIndexPage();
const setup = customRenderServerAsync(TopicIndexPage, {});

describe(`<${TopicIndexPage.name}/>`, () => {
  testLoadedPageContract({
    pageLoaderMock,
    setup,
    successData: MOCK_INDEX_PAGE,
    loaderArgs: [MOCK_TENANT_SANITY_CONTEXT],
    logEvent: TOPIC_INDEX_LOG.PAGE_FETCH_FAILED,
    currentCrumb: MOCK_INDEX_PAGE.headingBlock.heading,
  });
  testRedirectsMissingLanguagePage({ pageLoaderMock, setup });
});
