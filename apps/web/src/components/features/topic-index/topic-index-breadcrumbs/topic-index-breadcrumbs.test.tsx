import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { okResult } from '@shinefold/utils';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { customRenderServerAsync } from '@web/testing/custom-render';
import {
  testThrowsOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TopicIndexBreadcrumbs } from './topic-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');

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

const setup = customRenderServerAsync(TopicIndexBreadcrumbs, {});

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
  testThrowsOnFetchFailure({
    pageLoaderMock: getTopicIndexPageMock,
    setup,
    eventFragment: TOPIC_INDEX_LOG.BREADCRUMBS_FETCH_FAILED,
  });
});
