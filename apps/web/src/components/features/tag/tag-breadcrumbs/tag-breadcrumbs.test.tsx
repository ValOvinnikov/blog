import { routes } from '@blog/config';
import { customRenderAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsJsonLdTrail,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { MOCK_TAG_SLUG, mockTag } from '@web/testing/shared/tag/fixtures';

import { TagBreadcrumbs } from './tag-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

const SITE_NAME = MOCK_SITE_SETTINGS.brand.name;
const MOCK_TAG = mockTag();
const TAG_HREF = routes.tag(MOCK_TAG_SLUG);
const MOCK_PAGE = { tag: MOCK_TAG, modules: [], seo: mockSeo() };

const setup = customRenderAsync(TagBreadcrumbs, {
  slug: MOCK_TAG_SLUG,
});

describe(`<${TagBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getTagPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTagPageMock,
    setup,
    eventFragment: 'tag_breadcrumbs.fetch_failed',
    logContext: { slug: MOCK_TAG_SLUG },
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_PAGE,
    linkSteps: [{ label: SITE_NAME, href: routes.home() }],
    currentLabel: MOCK_TAG.title,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_PAGE,
    itemPath: TAG_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_PAGE,
    expectedTrail: [
      { name: SITE_NAME, path: routes.home() },
      { name: MOCK_TAG.title, path: TAG_HREF },
    ],
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_PAGE,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTagPageMock,
    setup,
    successData: MOCK_PAGE,
    description: 'forwards the slug to getTagPage',
    expectedArgs: [MOCK_TAG_SLUG],
  });
});
