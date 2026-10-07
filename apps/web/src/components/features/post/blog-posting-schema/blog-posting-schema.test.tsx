import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';
import type { MockInstance } from 'vitest';

import { BlogPostingSchema } from './blog-posting-schema';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const setup = customRenderAsync(BlogPostingSchema, {
  slug: 'hello-world',
});

describe(`<${BlogPostingSchema.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  describe('when the post cannot be resolved', () => {
    let errorSpy: MockInstance;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('calls notFound() without logging when no page_post matches the slug', async () => {
      getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('calls notFound() when the fetch fails', async () => {
      getPostPageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the post exists', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });
    });

    it('renders the JSON-LD BlogPosting schema script', async () => {
      await setup();

      const script = screen.getByTestId('json-ld-script');
      expect(script).toHaveAttribute('type', 'application/ld+json');
      expect(script.textContent).toContain('"@type":"BlogPosting"');
    });

    it('renders nothing when the request has no base URL', async () => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...DEFAULT_REQUEST_CONTEXT,
        metadataBase: undefined,
      });

      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });

    it('forwards the slug to getPostPage', async () => {
      await setup();

      expect(getPostPageMock).toHaveBeenCalledWith('hello-world');
    });
  });
});
