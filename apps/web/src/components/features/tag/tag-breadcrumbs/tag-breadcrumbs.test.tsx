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
import { mockTag } from '@web/testing/shared/tag/fixtures';

import { TagBreadcrumbs } from './tag-breadcrumbs';

const SITE_NAME = MOCK_SITE_SETTINGS.brand.name;
const TAG_HREF = '/tags/typescript';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

const tag = mockTag({ title: 'TypeScript', slug: 'typescript' });
const successData = { tag, modules: [], seo: mockSeo() };

const setup = customRenderAsync(TagBreadcrumbs, {
  slug: 'typescript',
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
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    linkSteps: [{ label: SITE_NAME, href: '/' }],
    currentLabel: 'TypeScript',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    itemPath: TAG_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    expectedTrail: [
      { name: SITE_NAME, path: '/' },
      { name: 'TypeScript', path: TAG_HREF },
    ],
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    description: 'forwards the slug to getTagPage',
    expectedArgs: ['typescript'],
  });
});
