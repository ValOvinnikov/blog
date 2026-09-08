import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { PostNewsletter } from './post-newsletter';

const {
  getPostPageMock,
  getTenantSanityContextMock,
  getNewsletterSettingsMock,
} = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getNewsletterSettingsMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      newsletterSettings: {
        v1: { getNewsletterSettings: getNewsletterSettingsMock },
      },
    },
  },
}));

// `NewsletterForm` imports `newsletter-actions.ts`, whose module-level
// `resolveNewsletterFromAddress(env.NEWSLETTER_FROM_ADDRESS)` call touches
// the real `@t3-oss/env-nextjs` server guard under jsdom — mocked out the
// same way `newsletter-form.test.tsx` does.
vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const setup = customRenderAsync(PostNewsletter, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(PostNewsletter, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue({
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    });
    getNewsletterSettingsMock.mockReset();
    getNewsletterSettingsMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Get new posts by email', description: undefined },
    });
  });

  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('renders the compact newsletter signup, sourced from the settings singleton, when newsletterEnabled is true', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, newsletterEnabled: true },
    });

    await setup();

    expect(screen.getByText('Get new posts by email')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('renders nothing when the post opts out (newsletterEnabled: false)', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, newsletterEnabled: false },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterSettingsMock).not.toHaveBeenCalled();
  });

  it('renders nothing and logs when the settings fetch fails, even though newsletterEnabled is true', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, newsletterEnabled: true },
    });
    getNewsletterSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('forwards the slug and tenant to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, newsletterEnabled: true },
    });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world', 'tenant-1');
  });

  it('forwards the resolved tenant Sanity context to getNewsletterSettings', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, newsletterEnabled: true },
    });

    await setup();

    expect(getNewsletterSettingsMock).toHaveBeenCalledWith(tenant);
  });
});
