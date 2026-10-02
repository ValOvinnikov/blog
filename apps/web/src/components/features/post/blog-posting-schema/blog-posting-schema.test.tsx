import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import { BlogPostingSchema } from './blog-posting-schema';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page', () => ({
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

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('renders the JSON-LD BlogPosting schema script', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const script = screen.getByTestId('json-ld-script');
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script.textContent).toContain('"@type":"BlogPosting"');
  });

  it('renders nothing when the request has no base URL', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      metadataBase: undefined,
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the slug to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world');
  });
});
