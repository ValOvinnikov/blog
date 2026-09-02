import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { customRenderAsync } from '@web/testing/custom-render';

import { NewsletterModule } from './newsletter-module';

const { getNewsletterMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getNewsletterMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      newsletter: { v1: { getNewsletter: getNewsletterMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: vi.fn(),
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
    vi.mocked(isCapabilityEnabled).mockReset();
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the resolved tenant Sanity context to getNewsletter', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await setup();

    expect(getNewsletterMock).toHaveBeenCalledWith('newsletter-1', tenant);
  });

  it('renders nothing, without fetching the module, when the NEWSLETTER capability is not entitled/enabled', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterMock).not.toHaveBeenCalled();
  });
});
