import { customRenderAsync } from '@web/testing/custom-render';
import {
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
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

const indexPage = {
  headingBlock: makeHeadingBlock({ heading: 'Subjects' }),
};

const setup = customRenderAsync(TopicIndexBreadcrumbs, {});

describe(`<${TopicIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
    getTopicIndexPageMock.mockResolvedValue({ ok: true, data: indexPage });
  });

  testStaticBreadcrumbsContract({
    setup,
    label: 'Subjects',
    path: '/topics',
  });
  testNotFoundWithoutLog({ pageLoaderMock: getTopicIndexPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTopicIndexPageMock,
    setup,
    eventFragment: 'topic_index_breadcrumbs.fetch_failed',
  });
});
