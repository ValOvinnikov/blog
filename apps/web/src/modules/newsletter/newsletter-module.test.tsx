import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(NewsletterModule, {
  id: 'newsletter-1',
});

describe(`<${NewsletterModule.name}/>`, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
    vi.mocked(isCapabilityEnabled).mockReset();
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the module's own trust cues in the form", async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: 'PRIMARY',
        headingBlock: makeHeadingBlock({ heading: 'Get new posts' }),
        variant: 'FULL',
        trustCues: ['No spam', 'Unsubscribe anytime'],
        layout: undefined,
        contentAlignment: undefined,
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
        headingBlock: makeHeadingBlock({
          heading: 'Get new posts',
          supportingText: 'Only shown in the full form.',
        }),
        variant: 'COMPACT',
        trustCues: undefined,
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

  it('forwards the resolved tenant Sanity context to getNewsletter', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await setup();

    expect(getNewsletterMock).toHaveBeenCalledWith('newsletter-1', tenant);
  });

  it('renders nothing, without fetching, when the NEWSLETTER capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterMock).not.toHaveBeenCalled();
  });

  it('checks the NEWSLETTER capability', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await setup();

    expect(isCapabilityEnabled).toHaveBeenCalledWith('NEWSLETTER');
  });
});
