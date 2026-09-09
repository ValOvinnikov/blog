import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { NewsletterModule } from './newsletter-module';

const {
  getNewsletterMock,
  getNewsletterSettingsMock,
  getTenantSanityContextMock,
} = vi.hoisted(() => ({
  getNewsletterMock: vi.fn(),
  getNewsletterSettingsMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      newsletter: { v1: { getNewsletter: getNewsletterMock } },
    },
    global: {
      newsletterSettings: {
        v1: { getNewsletterSettings: getNewsletterSettingsMock },
      },
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
  tenant: 'tenant-1',
});

describe(NewsletterModule, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
    getNewsletterSettingsMock.mockReset();
    getNewsletterSettingsMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Get new posts', trustCues: undefined },
    });
    vi.mocked(isCapabilityEnabled).mockReset();
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('passes the settings-sourced trustCues through to the rendered form', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: 'PRIMARY',
        sectionHeader: { heading: 'Get new posts', supportingText: undefined },
        variant: 'FULL',
        layout: undefined,
        contentAlignment: undefined,
      },
    });
    getNewsletterSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Get new posts',
        trustCues: ['No spam', 'Unsubscribe anytime'],
      },
    });

    await setup();

    expect(screen.getByText('No spam')).toBeVisible();
    expect(screen.getByText('Unsubscribe anytime')).toBeVisible();
  });

  it('renders the compact form (no supporting text) for a COMPACT module', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: 'PRIMARY',
        sectionHeader: {
          heading: 'Get new posts',
          supportingText: 'Only shown in the full form.',
        },
        variant: 'COMPACT',
        layout: undefined,
        contentAlignment: undefined,
      },
    });

    await setup();

    expect(screen.getByText('Get new posts')).toBeVisible();
    expect(
      screen.queryByText('Only shown in the full form.'),
    ).not.toBeInTheDocument();
  });

  it('renders no trust cues, without failing, when the newsletter settings fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: 'PRIMARY',
        sectionHeader: { heading: 'Get new posts', supportingText: undefined },
        variant: 'FULL',
        layout: undefined,
        contentAlignment: undefined,
      },
    });
    getNewsletterSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await setup();

    expect(screen.getByText('Get new posts')).toBeVisible();
    expect(screen.queryByText('No spam')).not.toBeInTheDocument();
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
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing, without fetching the module, when the NEWSLETTER capability is not entitled/enabled', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterMock).not.toHaveBeenCalled();
  });

  it('forwards the tenant route param to isCapabilityEnabled', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await setup();

    expect(isCapabilityEnabled).toHaveBeenCalledWith('NEWSLETTER', 'tenant-1');
  });
});
