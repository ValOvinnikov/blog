import { customRenderAsync } from '@web/testing/custom-render';

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

// `NewsletterModuleView` renders `NewsletterForm`, which imports
// `newsletter-actions.ts`, whose module-level
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

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
