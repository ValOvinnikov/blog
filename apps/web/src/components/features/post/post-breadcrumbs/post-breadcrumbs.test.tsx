import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

import { PostBreadcrumbs } from './post-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

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
      { label: 'Home', href: '/' },
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
      expect(within(nav).getByRole('link', { name: 'Home' })).toBeVisible();
      expect(within(nav).queryByText('Engineering')).not.toBeInTheDocument();
    });
  });
});
