import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { BlogPostingSchema } from './blog-posting-schema';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const SLUG = 'hello-world';

const setup = customRenderAsync(BlogPostingSchema, {
  slug: SLUG,
});

describe(`<${BlogPostingSchema.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  describe('when the post cannot be resolved', () => {
    it('calls notFound() without logging when no page_post matches the slug', async () => {
      getPostPageMock.mockResolvedValue(okResult());

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('calls notFound() when the fetch fails', async () => {
      getPostPageMock.mockResolvedValue(errorResult(new Error('boom')));

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the post exists', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue(okResult(mockPostDetail));
    });

    it('renders the JSON-LD BlogPosting schema script', async () => {
      await setup();

      const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
      expect(script).toHaveAttribute('type', 'application/ld+json');
      expect(script.textContent).toContain('"@type":"BlogPosting"');
    });

    it('renders nothing when the request has no base URL', async () => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        metadataBase: undefined,
      });

      await setup();

      const script = screen.queryByTestId(JSON_LD_SCRIPT_TEST_ID);
      expect(script).not.toBeInTheDocument();
    });

    it('forwards the slug to getPostPage', async () => {
      await setup();

      expect(getPostPageMock).toHaveBeenCalledWith(SLUG);
    });
  });
});
