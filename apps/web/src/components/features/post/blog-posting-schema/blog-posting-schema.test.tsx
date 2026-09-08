import { customRenderAsync } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { BlogPostingSchema } from './blog-posting-schema';

const { getPostPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

const setup = customRenderAsync(BlogPostingSchema, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(BlogPostingSchema, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
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

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BlogPosting"');
  });

  it('renders nothing when the tenant base URL fails to resolve', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the slug and tenant to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world', 'tenant-1');
  });
});
