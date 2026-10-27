import { okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_POST_DETAIL } from '@web/testing/pages/blog-post-page/fixtures';
import {
  testForwardsArgsToLoader,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { MOCK_BLOG_POSTING_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { BlogPostingSchema } from './blog-posting-schema';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const setup = customRenderAsync(BlogPostingSchema, {
  slug: MOCK_POST_DETAIL.slug,
});

describe(`<${BlogPostingSchema.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getPostPageMock, setup });
  testNotFoundOnFetchFailure({ pageLoaderMock: getPostPageMock, setup });

  describe('when the post exists', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue(okResult(MOCK_POST_DETAIL));
    });

    it('renders the JSON-LD BlogPosting schema script', async () => {
      await setup();

      const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);

      expect(script).toHaveAttribute('type', 'application/ld+json');
      expect(script.textContent).toContain(MOCK_BLOG_POSTING_JSON_LD_FRAGMENT);
    });

    it('renders nothing when the request has no base URL', async () => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        metadataBase: undefined,
      });

      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });
  });

  testForwardsArgsToLoader({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: MOCK_POST_DETAIL,
    description: 'forwards the slug to getPostPage',
    expectedArgs: [MOCK_POST_DETAIL.slug],
  });
});
