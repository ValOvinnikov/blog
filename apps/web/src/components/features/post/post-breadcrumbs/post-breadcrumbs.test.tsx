import { okResult } from '@blog/utils';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_POST_DETAIL } from '@web/testing/pages/blog-post-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsJsonLdTrail,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';

import { PostBreadcrumbs } from './post-breadcrumbs';

const POST_SLUG = MOCK_POST_DETAIL.slug;
const SITE_NAME = MOCK_SITE_SETTINGS.brand.name;
const TOPIC_HREF = `/topics/${MOCK_POST_DETAIL.topic.slug}`;
const POST_TITLE = MOCK_POST_DETAIL.title;
const TOPIC_TITLE = MOCK_POST_DETAIL.topic.title;

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

const setup = customRenderAsync(PostBreadcrumbs, {
  slug: POST_SLUG,
});

describe(`<${PostBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getPostPageMock, setup });
  testNotFoundOnFetchFailure({ pageLoaderMock: getPostPageMock, setup });
  testBreadcrumbsTrail({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: MOCK_POST_DETAIL,
    linkSteps: [
      { label: SITE_NAME, href: '/' },
      { label: TOPIC_TITLE, href: TOPIC_HREF },
    ],
    currentLabel: POST_TITLE,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: MOCK_POST_DETAIL,
    itemPath: TOPIC_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: MOCK_POST_DETAIL,
    expectedTrail: [
      { name: SITE_NAME, path: '/' },
      { name: TOPIC_TITLE, path: TOPIC_HREF },
      { name: POST_TITLE, path: `/blog/${POST_SLUG}` },
    ],
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: MOCK_POST_DETAIL,
    description: 'forwards the slug to getPostPage',
    expectedArgs: [POST_SLUG],
  });

  describe('when the topic has no topic page', () => {
    it('omits the topic crumb', async () => {
      getPostPageMock.mockResolvedValue(
        okResult({
          ...MOCK_POST_DETAIL,
          topic: { ...MOCK_POST_DETAIL.topic, slug: undefined },
        }),
      );

      await setup();

      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(nav).getByRole('link', { name: SITE_NAME })).toBeVisible();
      expect(within(nav).queryByText(TOPIC_TITLE)).not.toBeInTheDocument();
    });
  });
});
