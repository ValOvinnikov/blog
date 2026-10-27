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

import { PostIndexBreadcrumbs } from './post-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getPostIndexPageMock } = vi.hoisted(() => ({
  getPostIndexPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock(
  '@web/server/post-index/get-post-index-page/get-post-index-page',
  () => ({
    getPostIndexPage: getPostIndexPageMock,
  }),
);

faker.seed(5776);

const MOCK_INDEX_HEADING = faker.lorem.words(2);
const MOCK_INDEX_PAGE = {
  headingBlock: mockHeadingBlock({ heading: MOCK_INDEX_HEADING }),
};

const setup = customRenderAsync(PostIndexBreadcrumbs, {});

describe(`<${PostIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
    getPostIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
  });

  testStaticBreadcrumbsContract({
    setup,
    label: MOCK_INDEX_HEADING,
    path: routes.blogIndex(),
  });
  testNotFoundWithoutLog({ pageLoaderMock: getPostIndexPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getPostIndexPageMock,
    setup,
    eventFragment: 'post_index_breadcrumbs.fetch_failed',
  });
});
