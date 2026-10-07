import { customRenderAsync } from '@web/testing/custom-render';
import {
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
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

const indexPage = {
  headingBlock: makeHeadingBlock({ heading: 'Journal' }),
};

const setup = customRenderAsync(PostIndexBreadcrumbs, {});

describe(`<${PostIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
    getPostIndexPageMock.mockResolvedValue({ ok: true, data: indexPage });
  });

  testStaticBreadcrumbsContract({
    setup,
    label: 'Journal',
    path: '/blog',
  });
  testNotFoundWithoutLog({ pageLoaderMock: getPostIndexPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getPostIndexPageMock,
    setup,
    eventFragment: 'post_index_breadcrumbs.fetch_failed',
  });
});
