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
  slug: 'hello-world',
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
      { label: 'Northwind Journal', href: '/' },
      { label: 'Engineering', href: '/topics/engineering' },
    ],
    currentLabel: 'Hello World',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    itemPath: '/topics/engineering',
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    expectedTrail: [
      { name: 'Northwind Journal', path: '/' },
      { name: 'Engineering', path: '/topics/engineering' },
      { name: 'Hello World', path: '/blog/hello-world' },
    ],
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    description: 'forwards the slug to getPostPage',
    expectedArgs: ['hello-world'],
  });

  describe('when the topic has no topic page', () => {
    it('omits the topic crumb', async () => {
      getPostPageMock.mockResolvedValue({
        ok: true,
        data: {
          ...mockPostDetail,
          topic: { ...mockPostDetail.topic, slug: undefined },
        },
      });

      await setup();

      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(
        within(nav).getByRole('link', { name: 'Northwind Journal' }),
      ).toBeVisible();
      expect(within(nav).queryByText('Engineering')).not.toBeInTheDocument();
    });
  });
});
