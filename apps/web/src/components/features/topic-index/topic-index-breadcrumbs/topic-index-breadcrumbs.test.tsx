import { routes } from '@blog/config';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync } from '@web/testing/custom-render';
import {
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TopicIndexBreadcrumbs } from './topic-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTopicIndexPageMock } = vi.hoisted(() => ({
  getTopicIndexPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock(
  '@web/server/topic-index/get-topic-index-page/get-topic-index-page',
  () => ({
    getTopicIndexPage: getTopicIndexPageMock,
  }),
);

faker.seed(5776);

const MOCK_INDEX_HEADING = faker.lorem.words(2);
const MOCK_INDEX_PAGE = {
  headingBlock: mockHeadingBlock({ heading: MOCK_INDEX_HEADING }),
};

const setup = customRenderAsync(TopicIndexBreadcrumbs, {});

describe(`<${TopicIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
    getTopicIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
  });

  testStaticBreadcrumbsContract({
    setup,
    label: MOCK_INDEX_HEADING,
    path: routes.topics(),
  });
  testNotFoundWithoutLog({ pageLoaderMock: getTopicIndexPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTopicIndexPageMock,
    setup,
    eventFragment: 'topic_index_breadcrumbs.fetch_failed',
  });
});
