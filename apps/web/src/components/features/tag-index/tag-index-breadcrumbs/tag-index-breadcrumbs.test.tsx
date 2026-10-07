import { customRenderAsync } from '@web/testing/custom-render';
import {
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TagIndexBreadcrumbs } from './tag-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTagIndexPageMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/tag-index/get-tag-index-page/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

const indexPage = {
  headingBlock: makeHeadingBlock({ heading: 'Keywords' }),
};

const setup = customRenderAsync(TagIndexBreadcrumbs, {});

describe(`<${TagIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTagIndexPageMock.mockReset();
    getTagIndexPageMock.mockResolvedValue({ ok: true, data: indexPage });
  });

  testStaticBreadcrumbsContract({
    setup,
    label: 'Keywords',
    path: '/tags',
  });
  testNotFoundWithoutLog({ pageLoaderMock: getTagIndexPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTagIndexPageMock,
    setup,
    eventFragment: 'tag_index_breadcrumbs.fetch_failed',
  });
});
