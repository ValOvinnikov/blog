import { okResult } from '@blog/utils';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsJsonLdTrail,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

import { PostBreadcrumbs } from './post-breadcrumbs';

const POST_SLUG = 'hello-world';
const SITE_NAME = 'Northwind Journal';
const TOPIC_HREF = '/topics/engineering';
const POST_TITLE = 'Hello World';

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
    successData: mockPostDetail,
    linkSteps: [
      { label: SITE_NAME, href: '/' },
      { label: 'Engineering', href: TOPIC_HREF },
    ],
    currentLabel: POST_TITLE,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    itemPath: TOPIC_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    expectedTrail: [
      { name: SITE_NAME, path: '/' },
      { name: 'Engineering', path: TOPIC_HREF },
      { name: POST_TITLE, path: '/blog/hello-world' },
    ],
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    description: 'forwards the slug to getPostPage',
    expectedArgs: [POST_SLUG],
  });

  describe('when the topic has no topic page', () => {
    it('omits the topic crumb', async () => {
      getPostPageMock.mockResolvedValue(
        okResult({
          ...mockPostDetail,
          topic: { ...mockPostDetail.topic, slug: undefined },
        }),
      );

      await setup();

      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(nav).getByRole('link', { name: SITE_NAME })).toBeVisible();
      expect(within(nav).queryByText('Engineering')).not.toBeInTheDocument();
    });
  });
});
