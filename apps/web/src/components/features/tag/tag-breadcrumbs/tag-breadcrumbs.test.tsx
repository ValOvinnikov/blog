import { customRenderAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { makeTag } from '@web/testing/shared/tag/fixtures';

import { TagBreadcrumbs } from './tag-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

const tag = makeTag({ title: 'TypeScript', slug: 'typescript' });
const successData = { tag, modules: [], seo: {} };

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
    linkSteps: [{ label: 'Home', href: '/' }],
    currentLabel: 'TypeScript',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    itemPath: '/tags/typescript',
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
