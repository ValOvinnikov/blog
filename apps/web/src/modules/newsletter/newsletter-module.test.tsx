import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';

import { NewsletterModule } from './newsletter-module';

const { getNewsletterMock } = vi.hoisted(() => ({
  getNewsletterMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      newsletter: { v1: { getNewsletter: getNewsletterMock } },
    },
  },
}));

// `NewsletterForm` imports `newsletter-actions.ts`, whose module-level
// `resolveNewsletterFromAddress(env.NEWSLETTER_FROM_ADDRESS)` call touches
// the real `@t3-oss/env-nextjs` server guard — mocked out the same way
// `newsletter-form.test.tsx` does, since this test only exercises the
// service→module wiring, not the submit flow.
vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const setup = customRenderAsync(NewsletterModule, {
  id: 'newsletter-1',
  locale: 'en',
});

describe(NewsletterModule, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
  });

  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the full newsletter signup with the CMS-authored heading/description', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        heading: 'Get new posts',
        description: 'Straight to inbox.',
        appearance: undefined,
      },
    });

    await setup();

    expect(screen.getByText('Get new posts')).toBeVisible();
    expect(screen.getByText('Straight to inbox.')).toBeVisible();
  });

  it('renders correctly inside the Section appearance wrapper with no appearance authored', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        heading: 'Get new posts',
        description: 'Straight to inbox.',
        appearance: undefined,
      },
    });

    await setup();

    const wrapper = screen.getByTestId('newsletter-module-newsletter-1');
    expect(within(wrapper).getByText('Get new posts')).toBeVisible();
  });

  it('renders the newsletter form as a direct child of Section, with no wrapping div', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        heading: 'Get new posts',
        description: 'Straight to inbox.',
        appearance: undefined,
      },
    });

    await setup();

    const wrapper = screen.getByTestId('newsletter-module-newsletter-1');
    expect(wrapper.tagName).toBe('SECTION');

    // `Section`'s own constrained inner div wraps exactly one child — the
    // newsletter form itself, with no extra module-owned wrapping div in
    // between (the removed `newsletterModuleVariants` div).
    const inner = wrapper.firstElementChild;
    expect(inner?.children).toHaveLength(1);
  });
});
